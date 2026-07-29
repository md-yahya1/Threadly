package com.forumhub.repository;

import com.forumhub.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByRecipientIdAndReadFalse(Long userId);

    @Modifying
    @Transactional
    @Query("update Notification n set n.read = true where n.recipient.id = :userId and n.read = false")
    int markAllReadForUser(Long userId);
}
