async function postTweet (tweet, timeline) {
  const hiddenMetadata = ` [\u200b]( "${tweet.id_str}|${timeline.userID}")`;

  const msg = await this.bot.sendMessage(timeline.channelID, {
    title: 'New Tweet',
    author: {
      name: `@${tweet.user.name}`,
      url: `https://twitter.com/${tweet.user.screen_name}`,
      icon_url: tweet.user.profile_image_url
    },
    url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    description: tweet.text + hiddenMetadata,
    timestamp: new Date(tweet.created_at)
  });
  if (msg) {
    (async () => {
      await msg.addReaction('twitterLike:400076857493684226');
      msg.addReaction('twitterRetweet:400076876430835722');
    })();
  }
}

async function init () {
  const timelines = await this.db.getAllTimelines();

  for (const timeline of timelines) {
    const link = await this.db.getLink(timeline.userID);
    if (!link) {
      return; // TODO: remove link
    }

    const stream = await this.RestClient.createTweetStream(
      link.OAuthAccessToken,
      link.OAuthAccessSecret
    );

    stream.on('response', (r) => {
      let output = '';

      r.on('data', (data) => {
        output += data.toString();
        if (data === '\r\n') {
          return;
        }
        try {
          output = JSON.parse(output);
          if (!output.friends) {
            postTweet.call(this, output, timeline);
          }
          output = '';
        } catch (e) {}
      });
    });
  }
}

module.exports = init;