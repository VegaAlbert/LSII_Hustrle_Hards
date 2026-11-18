package com.tecnocampus.LS2.protube_back.controller.dto;

/**
 * Confirmation of DELETE /api/account. Accounts with a password send it in {@code password}; accounts created with
 * Google that never set one type their username in {@code confirmation} instead. The service checks which one applies.
 */
public record DeleteAccountRequest(String password, String confirmation) {
}
