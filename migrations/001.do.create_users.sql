-- home_state and nickname are being wired in for future expansion, not used now

CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT, 
    nickname TEXT DEFAULT NULL,
    home_state TEXT DEFAULT NULL,
    date_created TIMESTAMP NOT NULL DEFAULT now(),
    user_type TEXT NOT NULL DEFAULT user
);

