ALTER TABLE users
    ADD COLUMN post_karma INT NOT NULL DEFAULT 0,
    ADD COLUMN comment_karma INT NOT NULL DEFAULT 0;

UPDATE users SET post_karma = karma;

ALTER TABLE users DROP COLUMN karma;

ALTER TABLE notifications
    ADD COLUMN actor_id BIGINT NULL,
    ADD CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id),
    ADD INDEX idx_notifications_recipient (user_id, is_read, created_at);

CREATE TABLE saved_comments (
    user_id BIGINT NOT NULL,
    comment_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (comment_id) REFERENCES comments(id),
    INDEX idx_saved_comments_user (user_id, created_at)
);

ALTER TABLE saved_posts ADD INDEX idx_saved_posts_user (user_id, created_at);
