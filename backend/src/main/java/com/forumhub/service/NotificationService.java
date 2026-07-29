package com.forumhub.service;

import com.forumhub.entity.Comment;
import com.forumhub.entity.Notification;
import com.forumhub.entity.Post;
import com.forumhub.entity.User;
import com.forumhub.repository.NotificationRepository;
import org.springframework.stereotype.Service;

/**
 * Creates the in-app notifications that Reddit-style interactions produce.
 * Actions a person takes on their own content never notify them.
 */
@Service
public class NotificationService {

    private static final int PREVIEW_LENGTH = 80;

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void newFollower(User actor, User recipient) {
        create(recipient, actor, Notification.NEW_FOLLOWER,
                "u/" + actor.username + " started following you", actor.id);
    }

    public void postReply(User actor, Post post, Comment reply) {
        create(post.author, actor, Notification.POST_REPLY,
                "u/" + actor.username + " commented on \"" + post.title + "\": " + preview(reply.content),
                post.id);
    }

    public void commentReply(User actor, Comment parent, Comment reply) {
        create(parent.author, actor, Notification.COMMENT_REPLY,
                "u/" + actor.username + " replied to your comment: " + preview(reply.content),
                parent.post.id);
    }

    private void create(User recipient, User actor, String type, String message, Long referenceId) {
        if (recipient == null || (actor != null && recipient.id.equals(actor.id))) {
            return;
        }
        notifications.save(new Notification(recipient, actor, type, truncate(message, 500), referenceId));
    }

    private String preview(String content) {
        return truncate(content, PREVIEW_LENGTH);
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return "";
        }
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }
}
