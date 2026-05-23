package com.example.makerskills.Service;

import com.example.makerskills.entity.AdDefault;
import com.example.makerskills.entity.Message;
import com.example.makerskills.entity.Playlistad;
import com.example.makerskills.entity.Screen;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OperatorDeletionService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MessageReplyRepository messageReplyRepository;
    private final NotificationRepository notificationRepository;
    private final CalendarRepository calendarRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SignupApprovalTokenRepository signupApprovalTokenRepository;
    private final ScreenRepository screenRepository;
    private final Playlistadrepository playlistadrepository;
    private final AdDefaultRepository adDefaultRepository;

    public OperatorDeletionService(
            UserRepository userRepository,
            MessageRepository messageRepository,
            MessageReplyRepository messageReplyRepository,
            NotificationRepository notificationRepository,
            CalendarRepository calendarRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            SignupApprovalTokenRepository signupApprovalTokenRepository,
            ScreenRepository screenRepository,
            Playlistadrepository playlistadrepository,
            AdDefaultRepository adDefaultRepository) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.messageReplyRepository = messageReplyRepository;
        this.notificationRepository = notificationRepository;
        this.calendarRepository = calendarRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.signupApprovalTokenRepository = signupApprovalTokenRepository;
        this.screenRepository = screenRepository;
        this.playlistadrepository = playlistadrepository;
        this.adDefaultRepository = adDefaultRepository;
    }

    @Transactional
    public void deleteOperatorById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!"operator".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only operator accounts can be deleted here");
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

        passwordResetTokenRepository.deleteByUser_Id(userId);
        signupApprovalTokenRepository.deleteByUser_Id(userId);

        calendarRepository.deleteByUserId(userId);

        List<Playlistad> playlists = playlistadrepository.findByUser_Id(userId);
        for (Playlistad p : playlists) {
            p.setUser(null);
        }
        playlistadrepository.saveAll(playlists);

        List<Screen> screens = screenRepository.findByCreatedBy_Id(userId);
        for (Screen s : screens) {
            s.setCreatedBy(null);
        }
        screenRepository.saveAll(screens);

        List<AdDefault> defaults = adDefaultRepository.findByUser_Id(userId);
        for (AdDefault d : defaults) {
            d.setUser(null);
        }
        adDefaultRepository.saveAll(defaults);

        userRepository.delete(user);
    }
}
