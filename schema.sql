-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Definición de Roles de Usuario
  CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');

-- 1. Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Películas
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,
    genre VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0), -- Duración en minutos
    rating VARCHAR(20) NOT NULL, -- Ej: PG-13, R, G
    poster_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Salas
DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rows_count INTEGER NOT NULL CHECK (rows_count > 0),
    columns_count INTEGER NOT NULL CHECK (columns_count > 0),
    capacity INTEGER GENERATED ALWAYS AS (rows_count * columns_count) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Funciones (Horarios)
CREATE TABLE showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Autocalculado por trigger
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_times CHECK (start_time < end_time)
);

-- 5. Tabla de Reservas (Cabecera)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Asientos Reservados (Detalle)
CREATE TABLE reserved_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL CHECK (row_number > 0),
    column_number INTEGER NOT NULL CHECK (column_number > 0)
);

-- INDEX 1: B-Tree en la búsqueda de películas por título (Búsquedas frecuentes de clientes)
CREATE INDEX idx_movies_title ON movies USING btree (title);

-- INDEX 2: Filtrado por género cinematográfico
CREATE INDEX idx_movies_genre ON movies USING btree (genre);

-- INDEX 3: Optimización del join crucial para cartelera (showtimes activos por sala y hora)
CREATE INDEX idx_showtimes_room_time ON showtimes (room_id, start_time);

-- 🔒 RESTRICCIÓN CRÍTICA DE ASIENTO ÚNICO (Garantiza la regla de negocio)
-- Un asiento (fila, columna) es único por cada función (showtime), relacionando la reserva.
-- Para lograrlo limpiamente, creamos un índice único compuesto que impida duplicados.
-- Sin embargo, como showtime_id está en la cabecera (bookings), requerimos un índice único parcial o manejarlo por trigger/filas.
-- El enfoque más elegante para asegurar la unicidad a nivel físico de base de datos relacionando showtime:
ALTER TABLE reserved_seats ADD COLUMN showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX idx_unique_seat_per_showtime 
ON reserved_seats (showtime_id, row_number, column_number);

-- Trigger 1
CREATE OR REPLACE FUNCTION fn_calculate_showtime_end_time()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INTEGER;
BEGIN
    -- Obtener la duración de la película asociada
    SELECT duration INTO v_duration FROM movies WHERE id = NEW.movie_id;
    
    -- Calcular end_time: start_time + duración de película + 20 minutos de limpieza
    NEW.end_time := NEW.start_time + (v_duration || ' minutes')::INTERVAL + INTERVAL '20 minutes';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_before_insert_showtime
BEFORE INSERT OR UPDATE OF start_time, movie_id ON showtimes
FOR EACH ROW
EXECUTE FUNCTION fn_calculate_showtime_end_time();

-- Trigger 2
CREATE OR REPLACE FUNCTION fn_prevent_showtime_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_overlap_count
    FROM showtimes
    WHERE room_id = NEW.room_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
          (NEW.start_time < end_time) AND (NEW.end_time > start_time)
      );

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Conflict: The selected room is already occupied during this time window (including cleaning margins).';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_showtime_overlap
BEFORE INSERT OR UPDATE ON showtimes
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_showtime_overlap();

-- Trigger 3
CREATE OR REPLACE FUNCTION fn_validate_seat_boundaries()
RETURNS TRIGGER AS $$
DECLARE
    v_rows_count INTEGER;
    v_columns_count INTEGER;
BEGIN
    -- Obtener las dimensiones de la sala a través del showtime
    SELECT r.rows_count, r.columns_count INTO v_rows_count, v_columns_count
    FROM showtimes s
    JOIN rooms r ON s.room_id = r.id
    WHERE s.id = NEW.showtime_id;

    IF NEW.row_number > v_rows_count OR NEW.column_number > v_columns_count THEN
        RAISE EXCEPTION 'Invalid Seat: Seat coordinates [%, %] exceed maximum room dimensions [%, %].', 
            NEW.row_number, NEW.column_number, v_rows_count, v_columns_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_seat_boundaries
BEFORE INSERT ON reserved_seats
FOR EACH ROW
EXECUTE FUNCTION fn_validate_seat_boundaries();

-- Procedimiento 1
CREATE OR REPLACE FUNCTION fn_validate_seat_boundaries()
RETURNS TRIGGER AS $$
DECLARE
    v_rows_count INTEGER;
    v_columns_count INTEGER;
BEGIN
    -- Obtener las dimensiones de la sala a través del showtime
    SELECT r.rows_count, r.columns_count INTO v_rows_count, v_columns_count
    FROM showtimes s
    JOIN rooms r ON s.room_id = r.id
    WHERE s.id = NEW.showtime_id;

    IF NEW.row_number > v_rows_count OR NEW.column_number > v_columns_count THEN
        RAISE EXCEPTION 'Invalid Seat: Seat coordinates [%, %] exceed maximum room dimensions [%, %].', 
            NEW.row_number, NEW.column_number, v_rows_count, v_columns_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_seat_boundaries
BEFORE INSERT ON reserved_seats
FOR EACH ROW
EXECUTE FUNCTION fn_validate_seat_boundaries();

-- Procedimiento 2
CREATE OR REPLACE FUNCTION fn_authenticate_user(
    p_email VARCHAR(255),
    p_plain_password TEXT
)
RETURNS TABLE (id UUID, email VARCHAR, role user_role) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.role
    FROM users u
    WHERE u.email = LOWER(TRIM(p_email))
      AND u.password = crypt(p_plain_password, u.password);
      
    -- Si no devuelve ninguna fila, la aplicación sabrá que las credenciales son inválidas
END;
$$ LANGUAGE plpgsql;

-- Procedimiento 3
CREATE OR REPLACE FUNCTION fn_create_booking_transaction(
    p_user_id UUID,
    p_showtime_id UUID,
    p_seats_json JSONB -- Formato esperado: [{"row": 1, "col": 2}, {"row": 1, "col": 3}]
)
RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_seat RECORD;
BEGIN
    -- 1. Bloqueo pesimista del Showtime para evitar modificaciones concurrentes en este instante
    PERFORM id FROM showtimes WHERE id = p_showtime_id FOR UPDATE;

    -- 2. Insertar la cabecera de la Reserva
    INSERT INTO bookings (user_id, showtime_id)
    VALUES (p_user_id, p_showtime_id)
    RETURNING id INTO v_booking_id;

    -- 3. Iterar sobre el JSON de asientos insertándolos uno a uno
    FOR v_seat IN SELECT * FROM jsonb_to_recordset(p_seats_json) AS x(row INT, col INT)
    LOOP
        BEGIN
            INSERT INTO reserved_seats (booking_id, showtime_id, row_number, column_number)
            VALUES (v_booking_id, p_showtime_id, v_seat.row, v_seat.col);
        EXCEPTION
            WHEN unique_violation THEN
                -- Desencadenar rollback automático al lanzar error de duplicado detectado por el índice único
                RAISE EXCEPTION 'Seat Conflict: Seat Row %, Column % is already reserved for this showtime.', 
                    v_seat.row, v_seat.col;
        END;
    END LOOP;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Procedimiento 4
CREATE OR REPLACE FUNCTION fn_orchestrate_showtime_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INTEGER;
    v_overlap_count INTEGER;
BEGIN
    -- 1. Conseguir duración de la película para calcular el fin
    SELECT duration INTO v_duration FROM movies WHERE id = NEW.movie_id;
    IF v_duration IS NULL THEN
        RAISE EXCEPTION 'Validation Error: The specified movie does not exist.';
    END IF;

    -- 2. Asignar de forma segura el end_time
    NEW.end_time := NEW.start_time + (v_duration || ' minutes')::INTERVAL + INTERVAL '20 minutes';

    -- 3. Validar inmediatamente el solapamiento en la misma sala usando el nuevo tiempo calculado
    SELECT COUNT(*) INTO v_overlap_count
    FROM showtimes
    WHERE room_id = NEW.room_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
          (NEW.start_time < end_time) AND (NEW.end_time > start_time)
      );

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Conflict: The selected room is already occupied during this time window (including cleaning margins).';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Un solo trigger que hace ambas tareas de forma secuencial y garantizada
CREATE TRIGGER trg_showtime_integrity_guard
BEFORE INSERT OR UPDATE ON showtimes
FOR EACH ROW
EXECUTE FUNCTION fn_orchestrate_showtime_integrity();

-- Procedimiento 5
CREATE OR REPLACE PROCEDURE pr_register_user(
    p_email VARCHAR(255),
    p_plain_password TEXT,
    p_role user_role
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO users (email, password, role)
    VALUES (
        LOWER(TRIM(p_email)), 
        crypt(p_plain_password, gen_salt('bf', 10)), -- Encriptación Blowfish robusta
        p_role
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Conflict: An account with email % already exists.', p_email;
END;
$$;