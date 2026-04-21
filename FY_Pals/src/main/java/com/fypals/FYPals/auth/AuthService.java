package com.fypals.FYPals.auth;

import com.fypals.FYPals.auth.dto.*;
import com.fypals.FYPals.enums.Role;
import com.fypals.FYPals.user.entity.*;
import com.fypals.FYPals.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = buildUserByRole(request);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    private User buildUserByRole(RegisterRequest req) {
        String hashed = passwordEncoder.encode(req.getPassword());

        return switch (req.getRole()) {
            case STUDENT -> {
                Student s = new Student();
                s.setEmail(req.getEmail());
                s.setPassword(hashed);
                s.setName(req.getName());
                s.setRole(Role.STUDENT);
                yield s;
            }
            case ADVISOR -> {
                Advisor a = new Advisor();
                a.setEmail(req.getEmail());
                a.setPassword(hashed);
                a.setName(req.getName());
                a.setRole(Role.ADVISOR);
                yield a;
            }
            case FYP_STAFF -> {
                FYPStaff f = new FYPStaff();
                f.setEmail(req.getEmail());
                f.setPassword(hashed);
                f.setName(req.getName());
                f.setRole(Role.FYP_STAFF);
                yield f;
            }
            case ADMIN -> {
                Admin ad = new Admin();
                ad.setEmail(req.getEmail());
                ad.setPassword(hashed);
                ad.setName(req.getName());
                ad.setRole(Role.ADMIN);
                yield ad;
            }
        };
    }

    public AuthResponse refreshToken(String oldToken) {
        // Extract email from old token even if expired
        String email = jwtUtil.extractEmail(oldToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String newToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(newToken, user.getEmail(), user.getRole().name());
    }

}
