// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Маршрутизация
const control = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        language: 'ru'
    })
}).addTo(map);

let currentEventMarker = null;
let currentEventType = null;

// Показать панель
function showRoutingPanel() {
    const routingContainer = document.querySelector('.leaflet-routing-container');
    if (routingContainer) {
        routingContainer.style.display = 'block';
        routingContainer.style.opacity = '1';
        routingContainer.style.right = '20px';
        routingContainer.style.top = '20px';
    }
}

// Скрыть панель
function hideRoutingPanel() {
    const routingContainer = document.querySelector('.leaflet-routing-container');
    if (routingContainer) {
        routingContainer.style.opacity = '0';
        setTimeout(() => {
            routingContainer.style.display = 'none';
        }, 300);
    }
}

// Переключить видимость
function toggleRoutingPanel() {
    const routingContainer = document.querySelector('.leaflet-routing-container');
    if (!routingContainer) return;

    if (routingContainer.style.display === 'none' ||
        routingContainer.style.display === '') {
        showRoutingPanel();
    } else {
        hideRoutingPanel();
    }
}

// Загрузка календаря и мероприятий
async function initApp() {
    try {
        // 1. Загружаем дни
        const daysRes = await fetch('http://127.0.0.1:5000/api/days');
        const days = await daysRes.json();
        const daysContainer = document.getElementById('days-container');

        daysContainer.innerHTML = '';

        // 2. Создаем кнопки дней
        days.forEach(day => {
            const dayBtn = document.createElement('span');
            dayBtn.className = 'day';
            dayBtn.textContent = day.day_number;

            dayBtn.addEventListener('click', () => {
                document.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
                dayBtn.classList.add('active');
                loadEvents(day.id); // Загружаем мероприятия для выбранного дня
            });

            daysContainer.appendChild(dayBtn);
        });

        // 3. Загружаем мероприятия для первого дня
        if (days.length > 0) {
            daysContainer.firstChild.classList.add('active');
            loadEvents(days[0].id);
        }
    } catch (err) {
        console.error('Ошибка инициализации:', err);
    }
}

// Глобальная переменная для хранения всех маркеров
let allMarkers = [];

// Функция очистки всех маркеров
function clearAllMarkers() {
    allMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    allMarkers = [];
}

function loadEventsByType(eventType) {
    currentEventType = eventType;

    fetch(`http://127.0.0.1:5000/api/events?event_type=${eventType}`)
        .then(res => res.json())
        .then(events => {
            clearAllMarkers(); // Очищаем предыдущие маркеры
            const container = document.getElementById('events-container');
            container.innerHTML = '';

            events.forEach(event => {
                // Добавляем карточку мероприятия
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <img src="${event.image}" alt="${event.title}">
                    <p class="price">От ₽${event.price}</p>
                    <h3>${event.title}</h3>
                    <p class="genre">${event.genre}</p>
                    <p class="date-place">${event.date} в ${event.time}, ${event.location}</p>
                `;

                card.addEventListener('click', () => {
                    clearAllMarkers();
                    showEventDetails(event);
                });

                container.appendChild(card);

                // Добавляем маркер на карту
                const marker = L.marker([event.y, event.x])
                    .addTo(map)
                    .bindPopup(`<b>${event.title}</b><br>${event.genre}`)
                    .on('click', () => {
                        clearAllMarkers();
                        marker.addTo(map);
                        allMarkers.push(marker);
                        showEventDetails(event);
                    });

                allMarkers.push(marker);
            });

            if (events.length > 0) {
                const bounds = events.map(e => [e.y, e.x]);
                map.fitBounds(bounds);
            }
        })
        .catch(err => console.error('Ошибка загрузки мероприятий:', err));
}

// Загрузка мероприятий
function loadEvents(dayId) {
    let url = `http://127.0.0.1:5000/api/events?day_id=${dayId}`;

    // Если выбран определенный тип, добавляем его в запрос
    if (currentEventType) {
        url += `&event_type=${currentEventType}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(events => {
            const container = document.getElementById('events-container');
            container.innerHTML = '';
            clearAllMarkers();

            events.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <img src="${event.image}" alt="${event.title}">
                    <p class="price">От ₽${event.price}</p>
                    <h3>${event.title}</h3>
                    <p class="genre">${event.genre}</p>
                    <p class="date-place">${event.date} в ${event.time}, ${event.location}</p>
                `;

                card.addEventListener('click', () => {
                    clearAllMarkers();
                    showEventDetails(event);
                });

                const marker = L.marker([event.y, event.x])
                    .addTo(map)
                    .bindPopup(`<b>${event.title}</b><br>${event.location}`)
                    .on('click', () => {
                        clearAllMarkers();
                        marker.addTo(map);
                        allMarkers.push(marker);
                        showEventDetails(event);
                    });

                allMarkers.push(marker);
                container.appendChild(card);
            });
        })
        .catch(err => console.error('Ошибка загрузки мероприятий:', err));
}

// Показать детали мероприятия
function showEventDetails(event) {
    // Удаляем предыдущий выделенный маркер
    if (currentEventMarker) {
        map.removeLayer(currentEventMarker);
    }

    currentEventMarker = L.marker([event.y, event.x], {
        icon: L.icon({
            iconUrl: 'images/markers/selected1.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    map.setView([event.y, event.x], 15);

    // Создаем или обновляем шторку
    let panel = document.querySelector('.event-detail-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'event-detail-panel';
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div class="event-detail-header">
            <button class="close-btn">&times;</button>
            <h3>${event.title}</h3>
        </div>            
         <p class="price">От ₽${event.price}</p>
        <button class="route-btn" data-lat="${event.y}" data-lng="${event.x}">Построить маршрут</button>
        <div class="event-detail-content">
            <img src="${event.image}" alt="${event.title}">
            <div class="event-meta">
                <p class="genre">${event.genre}</p>
                <p class="about-concert">О концерте</p>
                <p class="date-place">${event.date} в ${event.time}, ${event.location}</p>
                <p class="description">${event.description || 'Описание отсутствует'}</p>
                
            </div>
        </div>
    `;

    // Обработчики событий
    panel.querySelector('.route-btn').addEventListener('click', () => {
        buildRoute(event.y, event.x);
    });

    panel.querySelector('.close-btn').addEventListener('click', () => {
        panel.remove();
        if (currentEventMarker) map.removeLayer(currentEventMarker);
        control.setWaypoints([]);
        hideRoutingPanel();
    });
}

// Построение маршрута (ваш оригинальный код)
function buildRoute(lat, lng) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const start = L.latLng(position.coords.latitude, position.coords.longitude);
                const end = L.latLng(lat, lng);
                console.log('Построение маршрута к:', lat, lng);

                // Показываем панель перед построением
                showRoutingPanel();

                control.setWaypoints([start, end]);
                map.fitBounds(L.latLngBounds([start, end]));
            },
            error => {
                alert('Не удалось определить местоположение: ' + error.message);
            }
        );
    } else {
        alert('Геолокация не поддерживается вашим браузером');
    }
}

// Глобальные переменные
let currentSearchResults = [];

// Функция поиска мероприятий
async function searchEvents(query) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/events?search=${encodeURIComponent(query)}`);
        const events = await response.json();

        currentSearchResults = events;
        displaySearchResults(events);

    } catch (error) {
        console.error('Ошибка поиска:', error);
        const eventsContainer = document.getElementById('events-container');
        eventsContainer.innerHTML = '<p class="error">Ошибка загрузки результатов</p>';
    }
}

// Отображение результатов поиска
function displaySearchResults(events) {
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = '';

    if (events.length === 0) {
        eventsContainer.innerHTML = '<p class="no-results">Ничего не найдено</p>';
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <img src="${event.image}" alt="${event.title}">
            <div class="event-info">
                <p class="price">От ₽${event.price}</p>
                <h3>${event.title}</h3>
                <p class="genre">${event.genre}</p>
                <p class="date-place">${event.date} в ${event.time}, ${event.location}</p>
            </div>
        `;

        eventCard.addEventListener('click', () => {
            showEventDetails(event);
        });

        eventsContainer.appendChild(eventCard);
    });
}

// Инициализация поиска
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Функция выполнения поиска
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            searchEvents(query);
        }
    };

    // Поиск по кнопке
    searchButton.addEventListener('click', performSearch);

    // Поиск по Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Добавить в initApp() после initSearch()
function initGenreButtons() {
    const musicBtn = document.querySelector('.header-btn:nth-child(1)');
    const comedyBtn = document.querySelector('.header-btn:nth-child(2)');
    const allEventsBtn = document.querySelector('.header-btn:nth-child(3)'); // Добавим кнопку "All"

    musicBtn.addEventListener('click', () => {
        loadEventsByType('music');
        document.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
    });

    comedyBtn.addEventListener('click', () => {
        loadEventsByType('comedy');
        document.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
    });

    allEventsBtn.addEventListener('click', () => {
        currentEventType = null;
        // Активируем первый день и загружаем его мероприятия
        const days = document.querySelectorAll('.day');
        if (days.length > 0) {
            days.forEach(d => d.classList.remove('active'));
            days[0].classList.add('active');
            loadEvents(days[0].getAttribute('data-day-id') || 1);
        }
    });
}

// В самом конце добавляем инициализацию темы
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initSearch();
    initGenreButtons();
});