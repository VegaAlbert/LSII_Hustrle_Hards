package com.tecnocampus.LS2.protube_back.services;

/**
 * Exception whose message is shown to the user. Besides the English message (used in logs and as fallback) it carries
 * the key of the message in {@code messages*.properties} and its arguments, so ApiExceptionHandler can answer in the
 * language of the request (Accept-Language).
 */
public abstract class LocalizedException extends RuntimeException {

    private final String messageKey;
    private final transient Object[] messageArgs;

    protected LocalizedException(String messageKey, String englishMessage, Object... messageArgs) {
        this(messageKey, englishMessage, null, messageArgs);
    }

    protected LocalizedException(String messageKey, String englishMessage, Throwable cause, Object... messageArgs) {
        super(englishMessage, cause);
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public Object[] getMessageArgs() {
        return messageArgs.clone();
    }
}
