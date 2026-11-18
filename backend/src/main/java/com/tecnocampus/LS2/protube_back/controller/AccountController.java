package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.AuthResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangeEmailRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangePasswordRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangeUsernameRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.DeleteAccountRequest;
import com.tecnocampus.LS2.protube_back.services.AccountDeletionService;
import com.tecnocampus.LS2.protube_back.services.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Account settings of the logged-in user (401 without a token, see SecurityConfig). Each change answers with a new
 * session (token and user) that the frontend keeps instead of the old one.
 */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;
    private final AccountDeletionService accountDeletionService;

    public AccountController(AccountService accountService, AccountDeletionService accountDeletionService) {
        this.accountService = accountService;
        this.accountDeletionService = accountDeletionService;
    }

    // 409 if the username is taken
    @PutMapping("/username")
    public ResponseEntity<AuthResponse> changeUsername(@Valid @RequestBody ChangeUsernameRequest request,
                                                       Authentication authentication) {
        return ResponseEntity.ok(accountService.changeUsername(authentication.getName(), request));
    }

    // 409 if another account has the email
    @PutMapping("/email")
    public ResponseEntity<AuthResponse> changeEmail(@Valid @RequestBody ChangeEmailRequest request,
                                                    Authentication authentication) {
        return ResponseEntity.ok(accountService.changeEmail(authentication.getName(), request));
    }

    // 400 if the current password is missing or wrong
    @PutMapping("/password")
    public ResponseEntity<AuthResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                       Authentication authentication) {
        return ResponseEntity.ok(accountService.changePassword(authentication.getName(), request));
    }

    /**
     * Deletes the account and everything that belongs to it (see AccountDeletionService). 400 if the password (or,
     * for Google accounts without one, the typed username) is missing or wrong. The frontend then logs out.
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(@RequestBody DeleteAccountRequest request, Authentication authentication) {
        accountDeletionService.deleteAccount(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
