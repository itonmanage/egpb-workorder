--
-- PostgreSQL database dump
--

\restrict BU51xvgHMOcgYiaI2pQYWPcFFnTvZeUccgidxaY9dKlzcp1psh6IknfIcfCUsyr

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0 ON CONFLICT (id) DO NOTHING;
SET lock_timeout = 0 ON CONFLICT (id) DO NOTHING;
SET idle_in_transaction_session_timeout = 0 ON CONFLICT (id) DO NOTHING;
SET transaction_timeout = 0 ON CONFLICT (id) DO NOTHING;
SET client_encoding = 'UTF8' ON CONFLICT (id) DO NOTHING;
SET standard_conforming_strings = on ON CONFLICT (id) DO NOTHING;
SELECT pg_catalog.set_config('search_path', '', false) ON CONFLICT (id) DO NOTHING;
SET check_function_bodies = false ON CONFLICT (id) DO NOTHING;
SET xmloption = content ON CONFLICT (id) DO NOTHING;
SET client_min_messages = warning ON CONFLICT (id) DO NOTHING;
SET row_security = off ON CONFLICT (id) DO NOTHING;

--
-- Data for Name: users ON CONFLICT (id) DO NOTHING; Type: TABLE DATA ON CONFLICT (id) DO NOTHING; Schema: public ON CONFLICT (id) DO NOTHING; Owner: egpb_admin
--

INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('c518004a-f93d-4e45-a632-fbcb4d92a70c', 'itadmin', NULL, NULL, NULL, NULL, '$2a$10$pm9fk3ua4x2qiD7RUaOOq.3qI/SGhYKcVqJZVq7yKoJluDzGxNWA2', 'IT_ADMIN', '2025-11-29 07:01:01.427', '2025-11-29 07:01:01.427') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('3e0b58c4-5ecf-4ad6-8a08-bb32fc9712e9', 'train01', NULL, NULL, NULL, NULL, '$2a$10$KnS0N.L0WaRSxs/IxdswhugfDlhCKAyMQ9g4aMjjLtBTxe9sloVB.', 'USER', '2025-11-29 08:51:03.703', '2025-11-29 08:51:03.703') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('d8094ad3-8150-4037-af73-a9a75689f5a6', 'eng', NULL, NULL, NULL, NULL, '$2a$10$I/G2lxZ79vgJWYnpuJSj9.ThL7Df.A3jlD2l4fE8QwPN2WQjd8yCu', 'ENGINEER_ADMIN', '2025-12-02 03:43:11.893', '2025-12-02 03:43:11.893') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('ca70b5e6-3597-47f8-8332-06bc89e9b3c6', 'Admin', '', NULL, '', NULL, '$2a$10$Kq/md/gf.q6SLNaEXuNDp.24QmV46kOa.6w8mcMdfBZbSq/tnTQri', 'ADMIN', '2025-11-29 07:00:23.474', '2025-12-03 05:21:03.809') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('fcfb1e25-4d1f-40e4-8415-b8fef1b15c76', 'Tanyakorn.lu', 'Tanyakorn Luesan', 'IT Officer', 'IT', '7420', '$2a$10$PFCtHFt0uA7gY2Cy6Zy4Fe1ZWf3qM1mjGXERoaoDslG3UNYagp4vS', 'IT_ADMIN', '2025-12-03 06:55:33.259', '2025-12-08 18:03:07.562') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('b4e0c86c-eeb8-4a6c-990c-13ecd2540e89', 'Aekkaman.Ko', 'Aekkaman Kongniam', 'IT Officer', 'A/C', '7420', '$2a$10$jKYUJC1V00u64Pefiv2L7O6TKA27uqlpCMi2E96QTmXYHFPaeWjgW', 'IT_ADMIN', '2025-12-02 10:39:14.946', '2025-12-10 07:48:04.094') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('0ae6196e-8076-4773-84b2-fdaa5932658f', 'DOIT', 'Nattapol Srivattano', 'Director of IT', 'Accounting(IT)', '7410', '$2a$10$n12w86JFZ2EbyaUD8gf0CePGosvBeSkhCFLHbEySs1vwZh8w/Cvry', 'ADMIN', '2025-12-02 07:07:03.711', '2025-12-11 03:20:23.602') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('b8876791-9339-4d94-a7c1-6fa64783311d', 'engadmin', 'Engineer Admin', 'Engineer Admin', 'Engineer', '7704', '$2a$10$Cu6QzZj6OeF34VIUJdu.p.ZA5sx2RXOeUTZ2UCM170rzfkUQAWI7e', 'ENGINEER_ADMIN', '2025-12-03 02:58:33.526', '2025-12-11 03:21:19.939') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('97a5edfb-f8e6-40ce-8431-cc9c3fd0f045', 'engineer1', '', '', '', '', '$2a$10$w8Iuw5Ll8Ro8e66qfDOr7u1l2f7uPnSyLyKkvpMiKXkFupV4qDGUy', 'ENGINEER_ADMIN', '2025-11-29 07:01:01.582', '2025-12-12 07:51:12.004') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('e6dad603-7974-4d99-ba2e-8fd5e5eb4e3d', 'ITMGR', 'Woravut S.', 'IT Manager', 'IT', '7410', '$2a$10$MTNr4BPB0K0.f7C2zBdRLeou/9Qnr5WInHFAVuwHpbYhR6q9YCSay', 'IT_ADMIN', '2025-11-29 17:31:42.92', '2025-12-18 01:58:09.651') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('5cf90bc6-46ff-421b-98f4-b5989865fd12', 'admin', NULL, NULL, NULL, NULL, '$2a$10$ADJc/dgERTEGe91h17KHeO6fAtwkmf5No4hPSjNeNdSoPA4YCHYna', 'ADMIN', '2025-12-18 05:43:08.423', '2025-12-18 05:43:08.423') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('8162a003-5431-4a4c-9136-3fee91d7e5c6', 'train02', '', '', '', '', '$2a$10$PomGAk0N35Shrhn7d9kIL.2/Z4HT8lTzPNEF/hTk3G8k1weP6olV2', 'HK', '2025-11-29 17:32:20.199', '2025-12-18 09:56:37.944') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('78d873ea-cd0e-468a-8ed5-c8209c3a5f02', 'user1', '', '', '', '', '$2a$10$OgS.e.G58nLtBF4taGINROjBjjGuAMnxE1TmSo.ILjEUfnVP0N9L.', 'FRONT_OFFICE', '2025-11-29 07:01:01.598', '2025-12-20 05:29:33.978') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('fbea60c3-ba21-45df-a108-66b2c936f35e', 'HKTEST', 'Created HK user', 'for test', 'HK', '2222', '$2a$10$7q8vGK7dA4cLW./6jClOguarq1C2T5IDodXpJ8.DBdEuCHVMDN2YW', 'HK', '2025-12-22 04:51:52.186', '2025-12-22 04:53:25.635') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id, username, full_name, "position", department, telephone_extension, password, role, created_at, updated_at) VALUES ('8fb5f955-2747-4179-b077-95b0c8d8bd3c', 'DOR', 'Assawin Assaweenarak', 'Director of Room', 'Front Office', '7201', '$2a$10$J/KYKkneHUAlnI4xVbRYEeB2PHtKh8lxcIq5yZemvP6iM0WSAMEX2', 'ENGINEER_ADMIN', '2025-12-23 02:42:49.801', '2025-12-23 02:42:49.801') ON CONFLICT DO NOTHING ON CONFLICT (id) DO NOTHING;


--
-- PostgreSQL database dump complete
--

\unrestrict BU51xvgHMOcgYiaI2pQYWPcFFnTvZeUccgidxaY9dKlzcp1psh6IknfIcfCUsyr

