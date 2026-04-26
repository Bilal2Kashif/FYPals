package com.fypals.FYPals.admin;

import com.fypals.FYPals.admin.dto.AdminPostDTO;
import com.fypals.FYPals.admin.dto.AdminTeamDTO;
import com.fypals.FYPals.admin.dto.AdminUserDTO;
import com.fypals.FYPals.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    // POST /admin/users — create a user with any role (e.g. FYP_STAFF)
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        adminService.createUser(
                body.get("name"),
                body.get("email"),
                body.get("password"),
                body.get("role")
        );
        return ResponseEntity.ok(Map.of("message", "User created successfully"));
    }

    // PUT /admin/users/{id}/role — change a user's role
    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        adminService.updateUserRole(id, body.get("role"));
        return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
    }

    // DELETE /admin/users/{id} — delete a user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ── Teams ─────────────────────────────────────────────────────────────────

    @GetMapping("/teams")
    public ResponseEntity<Page<AdminTeamDTO>> getAllTeams(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllTeams(pageable));
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    @GetMapping("/posts")
    public ResponseEntity<Page<AdminPostDTO>> getAllPosts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllPosts(pageable));
    }
}