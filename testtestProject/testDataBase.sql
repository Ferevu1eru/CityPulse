PGDMP      
                 }            testDataBase    16.3    16.4     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    17496    testDataBase    DATABASE     �   CREATE DATABASE "testDataBase" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE "testDataBase";
                postgres    false            �            1259    17497 	   testTable    TABLE     ~   CREATE TABLE public."testTable" (
    id "char" NOT NULL,
    name text NOT NULL,
    x text NOT NULL,
    y text NOT NULL
);
    DROP TABLE public."testTable";
       public         heap    postgres    false            �          0    17497 	   testTable 
   TABLE DATA           5   COPY public."testTable" (id, name, x, y) FROM stdin;
    public          postgres    false    215   u                  2606    17503    testTable testTable_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."testTable"
    ADD CONSTRAINT "testTable_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."testTable" DROP CONSTRAINT "testTable_pkey";
       public            postgres    false    215            �   �   x��ͱ1��ڞ� �sq���2�TPRP ��t7��F��^��zB8c�;��D#�P̼F�K�Zԝ�p��i��u�q���kM�%�hƑt�<�/��G)V�(K��x&��tQ���b�����^�R     