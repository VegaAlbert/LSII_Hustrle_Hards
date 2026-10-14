package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown on a failed login. The message is the same whether the username or the password is wrong,
 * so nobody can find out which usernames exist.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid username or password");
    }
}
