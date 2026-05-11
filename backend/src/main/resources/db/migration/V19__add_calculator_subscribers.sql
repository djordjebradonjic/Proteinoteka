CREATE TABLE calculator_subscribers (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    name       VARCHAR(255),
    goal       VARCHAR(50),
    protein    INTEGER,
    calories   INTEGER,
    carbs      INTEGER,
    fat        INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calc_subscribers_goal ON calculator_subscribers(goal);
CREATE INDEX idx_calc_subscribers_created ON calculator_subscribers(created_at);
