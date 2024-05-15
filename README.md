# MC Server Controller

Enables to boot Minecraft servers from Discord!  
(In short, it's a Discord bot.)

## How to Use

1. Clone this repo.
2. Run server/install.sh (for Windows, server/install.bat).
3. Fill in [.env](.env.example) and [config.json](config-example.json) entries.
4. Run the command (requires node.js): `node src/index.js`.

> The server folder is prepared with a _minimum_ configuration of hub server and proxy server folders. If you want to add more servers, you can create new server folders in the temp and (or) event folders.

## Commands

- `/ping` will send a ping to the bot.
- `/start 'target-server'` will starts the specified server.
- `/stop 'target-server'` will stops the specified server.

## Others

### License

This repository is licensed under [Apache-2.0 License](LICENSE).

### Contact

**Discord: haiiro2gou**  
**X(Twitter): [@blanoir3298](https://x.com/blanoir3298)**  
**Youtube: [はいいろ](https://www.youtube.com/@haiiro2gou)**
