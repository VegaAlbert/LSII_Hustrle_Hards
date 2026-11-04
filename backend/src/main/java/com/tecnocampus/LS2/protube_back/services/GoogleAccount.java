package com.tecnocampus.LS2.protube_back.services;

/**
 * The data ProTube uses from a verified Google ID token.
 *
 * @param email verified email of the Google account (lower case)
 * @param name  display name, may be null
 */
public record GoogleAccount(String email, String name) {
}
