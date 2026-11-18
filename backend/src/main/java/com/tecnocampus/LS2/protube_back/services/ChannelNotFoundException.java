package com.tecnocampus.LS2.protube_back.services;

/**
 * US-13: there is no user (channel) with that username. Answered with 404.
 */
public class ChannelNotFoundException extends LocalizedException {

    public ChannelNotFoundException(String channel) {
        super("error.channel.notFound", "Channel " + channel + " not found", channel);
    }
}
