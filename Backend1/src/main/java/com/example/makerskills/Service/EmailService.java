package com.example.makerskills.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;

import jakarta.mail.internet.MimeMessage;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    /**
     * Optional: app must start even if SMTP isn't configured.
     * When null, email sending is simply skipped.
     */
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@makerskills.local}")
    private String from;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.public.base-url:http://localhost:5173}")
    private String publicBaseUrl;

    @Value("${server.port:8081}")
    private String serverPort;

    public void sendWelcome(String to, String fullName, String role) {
        String subject = "Bienvenue chez MakerSkills";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
                  <div style="padding:16px 0;border-bottom:1px solid #eee;">
                    <img src="cid:logo" alt="MakerSkills" style="height:44px"/>
                  </div>
                  <h2 style="color:#111;margin:20px 0 8px;">Bienvenue %s</h2>
                  <p style="color:#444;line-height:1.5;margin:0 0 14px;">
                    Ton compte <b>%s</b> est prêt. Merci de nous avoir rejoints.
                  </p>
                  <p style="color:#666;font-size:12px;margin-top:22px;">
                    MakerSkills • Ceci est un email automatique.
                  </p>
                </div>
                """.formatted(escape(fullName), escape(role));

        sendHtml(to, subject, html,
                "Bonjour " + fullName + ",\n\nTon compte " + role + " est prêt.\n\nMakerSkills");
    }

    /**
     * Advertiser onboarding email: includes credentials (as requested).
     * Note: sending passwords by email is insecure; this is intentional per product request.
     */
    public void sendAdvertiserWelcomeWithCredentials(String to, String fullName, String email, String rawPassword) {
        String subject = "Bienvenue chez MakerSkills — Vos accès";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#0b0f19;padding:22px;border-radius:18px;">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
                    <img src="cid:logo" alt="MakerSkills" style="height:46px"/>
                    <div style="color:#fff;font-weight:700;font-size:18px;">MakerSkills</div>
                  </div>
                  <div style="background:#111827;border-radius:16px;padding:18px;">
                    <h2 style="color:#fff;margin:0 0 10px;">Bienvenue %s</h2>
                    <p style="color:#cbd5e1;line-height:1.6;margin:0 0 14px;">
                      Votre compte <b>advertiser</b> a été créé. Voici vos identifiants:
                    </p>
                    <div style="background:#0b1220;border:1px solid #1f2937;border-radius:12px;padding:14px;">
                      <div style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">Identifiants</div>
                      <p style="color:#fff;margin:10px 0 0;line-height:1.7;">
                        <b>Email:</b> %s<br/>
                        <b>Mot de passe:</b> %s
                      </p>
                    </div>
                    <p style="color:#94a3b8;font-size:12px;margin:14px 0 0;">
                      Conseil: changez votre mot de passe après la première connexion.
                    </p>
                  </div>
                </div>
                """.formatted(escape(fullName), escape(email), escape(rawPassword));

        sendHtml(to, subject, html,
                "Bienvenue " + fullName + "\n\nEmail: " + email + "\nMot de passe: " + rawPassword);
    }

    public void sendAdminApprovalRequest(String newUserEmail, String fullName, String role, String approveUrl, String rejectUrl) {
        if (adminEmail == null || adminEmail.isBlank()) return;
        String subject = "Validation requise: nouveau compte";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
                  <div style="padding:16px 0;border-bottom:1px solid #eee;">
                    <img src="cid:logo" alt="MakerSkills" style="height:44px"/>
                  </div>
                  <h2 style="color:#111;margin:20px 0 8px;">Demande de validation</h2>
                  <p style="color:#444;line-height:1.5;margin:0 0 12px;">
                    Un nouvel utilisateur demande l'accès.
                  </p>
                  <ul style="color:#444;line-height:1.6;">
                    <li><b>Nom</b>: %s</li>
                    <li><b>Email</b>: %s</li>
                    <li><b>Rôle</b>: %s</li>
                  </ul>
                  <div style="margin:18px 0;">
                    <a href="%s" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:bold;margin-right:10px;">
                      Approuver
                    </a>
                    <a href="%s" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:bold;">
                      Refuser
                    </a>
                  </div>
                  <p style="color:#666;font-size:12px;margin-top:22px;">
                    Si tu n'es pas à l'origine de cette demande, ignore cet email.
                  </p>
                </div>
                """.formatted(escape(fullName), escape(newUserEmail), escape(role), approveUrl, rejectUrl);

        sendHtml(adminEmail, subject, html,
                "Validation requise\n\nNom: " + fullName + "\nEmail: " + newUserEmail + "\nRole: " + role
                        + "\nApprove: " + approveUrl + "\nReject: " + rejectUrl);
    }

    /**
     * Password reset OTP (6 digits).
     *
     * @return {@code true} if SMTP accepted the message; {@code false} if mail is disabled or sending failed (see logs).
     */
    public boolean sendPasswordResetOtpEmail(String to, String otp) {
        if (!StringUtils.hasText(to) || !StringUtils.hasText(otp)) {
            return false;
        }
        String base = publicBaseUrl == null ? "http://localhost:5173" : publicBaseUrl.replaceAll("/+$", "");
        String emailEnc = URLEncoder.encode(to, StandardCharsets.UTF_8);
        String openAppUrl = base + "/reset-password?email=" + emailEnc + "&step=code";
        String subject = "Code de réinitialisation — MakerSkills";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
                  <div style="padding:16px 0;border-bottom:1px solid #eee;">
                    <img src="cid:logo" alt="MakerSkills" style="height:44px"/>
                  </div>
                  <h2 style="color:#111;margin:20px 0 8px;">Réinitialiser votre mot de passe</h2>
                  <p style="color:#444;line-height:1.5;margin:0 0 14px;">
                    Voici votre <b>code à 6 chiffres</b> (expire dans <b>30&nbsp;minutes</b>) :
                  </p>
                  <div style="margin:26px 0;text-align:center;">
                    <span style="display:inline-block;letter-spacing:0.35em;font-size:32px;font-weight:800;color:#111;background:#fafafa;border:2px solid #e4e4e7;border-radius:12px;padding:14px 28px;font-family:ui-monospace,Consolas,monospace;">%s</span>
                  </div>
                  <p style="color:#444;line-height:1.5;margin:0 0 12px;">
                    Sur le site&nbsp;: ouvrez la page mot de passe oublié, entrez votre e-mail puis ce code, puis vous pourrez choisir un nouveau mot de passe.
                  </p>
                  <div style="margin:18px 0;">
                    <a href="%s" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">
                      Ouvrir la page « Mot de passe oublié »
                    </a>
                  </div>
                  <p style="color:#666;font-size:12px;line-height:1.5;margin:0;">
                    Si vous n’avez pas demandé cette réinitialisation, ignorez cet e-mail.
                  </p>
                  <p style="color:#999;font-size:11px;margin-top:22px;">
                    MakerSkills • Email automatique
                  </p>
                </div>
                """.formatted(escape(otp), escape(openAppUrl));

        String plain = "Réinitialisation du mot de passe MakerSkills\n\n"
                + "Code (30 minutes):\n"
                + otp + "\n\n"
                + "Page web:\n" + openAppUrl + "\n";

        if (mailSender == null) {
            log.warn("OTP not sent — no JavaMailSender. Set SMTP_MAIL_USERNAME and SMTP_MAIL_PASSWORD.");
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plain, html);
            addInlineLogo(helper);
            mailSender.send(message);
            log.info("Password reset OTP sent (HTML). To={}", to);
            return true;
        } catch (Exception e) {
            log.warn("OTP mail (HTML) failed; retrying plaintext. To={}, err={}", to, e.toString());
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(plain);
            mailSender.send(msg);
            log.info("Password reset OTP sent (text). To={}", to);
            return true;
        } catch (Exception e) {
            log.error("OTP mail failed completely (check Gmail app password / SMTP_* env vars). To={}, err={}", to, e.toString());
            return false;
        }
    }

    private void send(String to, String subject, String body) {
        try {
            if (mailSender == null) {
                log.warn("Mail not sent (no JavaMailSender). Set SMTP_USER/SMTP_PASS env vars. To={}, subject={}", to, subject);
                return;
            }
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Mail sent. To={}, subject={}", to, subject);
        } catch (Exception e) {
            log.warn("Mail send failed (text). To={}, subject={}, err={}", to, subject, e.toString());
        }
    }

    private void sendHtml(String to, String subject, String html, String fallbackText) {
        try {
            if (mailSender == null) {
                log.warn("Mail not sent (no JavaMailSender). Set SMTP_USER/SMTP_PASS env vars. To={}, subject={}", to, subject);
                return;
            }
            MimeMessage message = mailSender.createMimeMessage();
            // multipart=true is required when providing both plain text + HTML alternatives
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(fallbackText, html);
            addInlineLogo(helper);
            mailSender.send(message);
            log.info("Mail sent (HTML). To={}, subject={}", to, subject);
        } catch (Exception e) {
            log.warn("Mail send failed (HTML). Falling back to text. To={}, subject={}, err={}", to, subject, e.toString());
            send(to, subject, fallbackText);
        }
    }

    private void addInlineLogo(MimeMessageHelper helper) {
        try {
            ClassPathResource res = new ClassPathResource("static/email/makerlight.png");
            if (!res.exists()) return;
            try (InputStream in = res.getInputStream()) {
                byte[] bytes = in.readAllBytes();
                helper.addInline("logo", new ByteArrayResource(bytes), "image/png");
            }
        } catch (Exception e) {
            log.warn("Inline logo attach failed (email still sends). err={}", e.toString());
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
