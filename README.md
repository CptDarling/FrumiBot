# FrumiBot

My Twitch bot

- [FrumiBot](#frumibot)
  - [Bot access](#bot-access)
    - [OAuth Token refresh](#oauth-token-refresh)
    - [Read and edit permissions](#read-and-edit-permissions)
  - [Links](#links)

## Bot access

When running the bot authentication might fail.  Try these recovery steps.

### OAuth Token refresh

```shell
curl -X POST https://id.twitch.tv/oauth2/token -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=refresh_token&refresh_token=$REFRESHTOKEN&client_id=$CLIENTID&client_secret=$CLIENTSECRET'
```

See the `C:\Users\Richard\AppData\Roaming\twitch-cli\.twitch-cli.env` file for values is Twitch CLI is used.

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

https://dev.twitch.tv/docs/irc/example-bot

https://dev.twitch.tv/docs/api/reference

https://dev.twitch.tv/docs/eventsub

https://dev.twitch.tv/docs/api/reference#get-users

https://dev.twitch.tv/docs/authentication/refresh-tokens#how-to-use-a-refresh-token

https://stackoverflow.com/questions/10461257/an-attempt-was-made-to-access-a-socket-in-a-way-forbidden-by-its-access-permissi

https://openweathermap.org/

https://github.com/tomaarsen/TwitchWeather/blob/master/TwitchWeather.py
