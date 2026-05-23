package com.example.makerskills.Service;

import com.example.makerskills.entity.Advertisement;
import com.example.makerskills.entity.Message;
import com.example.makerskills.entity.Pack;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.AdStatisticsRepository;
import com.example.makerskills.repository.AdvertisementRepository;
import com.example.makerskills.repository.CalendarRepository;
import com.example.makerskills.repository.MessageReplyRepository;
import com.example.makerskills.repository.MessageRepository;
import com.example.makerskills.repository.NotificationRepository;
import com.example.makerskills.repository.PackRepository;
import com.example.makerskills.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdvertiserDeletionService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MessageReplyRepository messageReplyRepository;
    private final NotificationRepository notificationRepository;
    private final AdvertisementRepository advertisementRepository;
    private final AdStatisticsRepository adStatisticsRepository;
    private final CalendarRepository calendarRepository;
    private final PackRepository packRepository;

    public AdvertiserDeletionService(
            UserRepository userRepository,
            MessageRepository messageRepository,
            MessageReplyRepository messageReplyRepository,
            NotificationRepository notificationRepository,
            AdvertisementRepository advertisementRepository,
            AdStatisticsRepository adStatisticsRepository,
            CalendarRepository calendarRepository,
            PackRepository packRepository) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.messageReplyRepository = messageReplyRepository;
        this.notificationRepository = notificationRepository;
        this.advertisementRepository = advertisementRepository;
        this.adStatisticsRepository = adStatisticsRepository;
        this.calendarRepository = calendarRepository;
        this.packRepository = packRepository;
    }

    @Transactional
    public void deleteAdvertiserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!"advertiser".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only advertiser accounts can be deleted here");
        }

        Long userId = user.getId();

        List<Message> messages = messageRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        List<Long> messageIds = messages.stream().map(Message::getId).toList();

        if (!messageIds.isEmpty()) {
            messageReplyRepository.deleteByMessage_IdIn(messageIds);
            notificationRepository.deleteByMessage_IdIn(messageIds);
        }
        notificationRepository.deleteByTargetUserId(userId);
        notificationRepository.deleteByFromUser_Id(userId);

        messageRepository.deleteByUser_Id(userId);
        messageReplyRepository.deleteByResponder_Id(userId);

        List<Advertisement> ads = advertisementRepository.findByUserId(userId);
        List<Long> adIds = ads.stream().map(Advertisement::getId).toList();
        if (!adIds.isEmpty()) {
            adStatisticsRepository.deleteByAdvertisement_IdIn(adIds);
        }
        advertisementRepository.deleteAll(ads);

        calendarRepository.deleteByUserId(userId);

        List<Pack> packs = packRepository.findAllPacksByAdvertiserId(userId);
        for (Pack pack : packs) {
            pack.getAdvertisers().removeIf(u -> u.getId().equals(userId));
            packRepository.save(pack);
        }

        userRepository.delete(user);
    }
}
