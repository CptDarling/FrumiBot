# FrumiBot

My Twitch bot

- [FrumiBot](#frumibot)
  - [Bot access](#bot-access)
    - [OAuth Token refresh](#oauth-token-refresh)
      - [Refresh by `curl`](#refresh-by-curl)
    - [Read and edit permissions](#read-and-edit-permissions)
  - [Links](#links)

## Bot access

When running the bot authentication might fail.  Try these recovery steps.

### OAuth Token refresh

The token can be refreshed by calling `node ./bot.js -t` and having files `token.json` and `client.json` in the project root.

The structure and content of the files is given below.

See file `C:\Users\Richard\AppData\Roaming\twitch-cli\.twitch-cli.env` for values Twitch CLI used to configure the bot in the first place.

client.json:

```json
{
    "CLIENT_ID": "<client ID goes here>",
    "CLIENT_SECRET": "<client secret goes here>"
}
```

token.json:

```json
{
    "refresh_token": "<current refresh token>"
}
```

The `token.js` file will contain other keys which will have been written by twitch-cli.  The only value used from the file in the refresh procedure is the `refresh_token` value.

#### Refresh by `curl`

```shell
curl -X POST https://id.twitch.tv/oauth2/token -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=refresh_token&refresh_token=$REFRESHTOKEN&client_id=$CLIENTID&client_secret=$CLIENTSECRET'
```

### Read and edit permissions

If authentication has failed after the token refresh get a new OAuth password.

```shell
twitch token -u -s 'chat:read chat:edit'
```

If you see this error when getting a token:
`An attempt was made to access a socket in a way forbidden by its access permissions` try these steps.

```shell
net stop hns
net start hns
```

Then retry fetching the token.

## Links

Chat: [Frumious__Bandersnatch - Chat - Twitch](https://www.twitch.tv/popout/frumious__bandersnatch/chat?popout=)

https://dev.twitch.tv/docs/irc/example-bot

https://dev.twitch.tv/docs/api/reference

https://dev.twitch.tv/docs/eventsub

https://dev.twitch.tv/docs/api/reference#get-users

https://dev.twitch.tv/docs/authentication/refresh-tokens#how-to-use-a-refresh-token

https://stackoverflow.com/questions/10461257/an-attempt-was-made-to-access-a-socket-in-a-way-forbidden-by-its-access-permissi

https://openweathermap.org/

https://github.com/tomaarsen/TwitchWeather/blob/master/TwitchWeather.py
