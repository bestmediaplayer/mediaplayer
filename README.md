# Free Open Source No-Download HTML5 Media Player for Video, Music, Audio, Android, iPhone, AVI, FLAC, FLV, GIF, M4A, MKV, MOV, MP3, MP4, MPG, OGG, SWF, VOB, WAV, WEBM, WMV #

I truly believe this media player can become BIGGER than VLC Media Player.

Why? Because this is the first fully browser-based app that can play every single video type out there. Just like VLC...but in the browser.

The other two popular ones, VLC Media Player and Windows Media Player, require downloads. And then there are bunch of Javascript Media Players for MP4 but that's basically it. For FLV files, the best library "flv.js" is not fully functional. It fails on half the FLV files I tested it on.


Here's a link to a functioning demo of [Media Player playing various videos](https://bestmediaplayer.org/).

Here's our email if you wanna reach out: contact@bestmediaplayer.org

Here's our twitter if you wanna follow us for updates and articles about media player: [Media Player Twitter](https://twitter.com/MediaPlayer13).

# Wanna help out? Couple big TODO items still left #

This project has the potential to be BIGGER than VLC Media Player. But VLC Media Player has a ton of features. I need your help to build out this open source project. Help contribute code!

- **Separate out media player into a standalone app that can be embedded into a Vue or React app.**
It's relatively simple but I wanted to gauge reaction to this project before I do this time consuming task.

- **Use a modern looking UI like video.js**
This is a relatively simple task and is probably the precursor to the next task that is much more difficult.

- **Implement seeking to any point in the file instead of only streaming from start.**
This is a difficult task requiring two things: 1) a good UI to capture seeking information from a click, and 2) break up a single FFMPEG command into multiple chunks.

- **Recycle FFMPEG instances more efficiently.**
Right now, to allow the user to play multiple files in the same browser instance, this app creates another FFMPEG instance, because there is no way to kill or pause the previous FFMPEG instance that is transcoding the whole file.

- **Investigate how to make FFMPEG encoding faster**
WebAssembly does not allow access to special CPU hardware instructions that could've significantly speed up the transcoding process. As a result, while FFMPEG on the desktop is usually very quick, FFMPEG in WebAssembly sometimes struggles to keep up.

## How to test ##
To run the test server on localhost: `nohup ./tools/server.sh &`. This is important to allow download of the wasm file as Content-Type `application/wasm`

# Another cool project using FFMPEG: [Free Online File Converter](https://fileconverter.digital/) #

This file converter leverages the power of running FFMPEG in the browser by shifting file conversion workload from the server to the browser. These incumbent services like Zamzar will soon be made obsolete by in-browser FFMPEG converting files. The legacy services can't compete because they are limited. They only allow a limited number of conversions in a 24 hour time period, and they also limit the size of file that you can upload. If you want anything beyond that, you need to pay $9/month, which is crazy expensive. Some people are on such a tight budget, they don't have $9 to spare like that.

The unique advantage that file conversion services like FileConverter.digital have over downloading FFMPEG is that there are actually some people in the world that can't do that...because the only thing they have is a phone, not a desktop computer. In many areas of the world, people get a phone before they get a computer. For these people, these powerful in-browser apps are a godsend. It allows them to perform file conversion services that would've been much more difficult before since they only have something like an Android phone.

Perhaps the biggest drawback of the FileConverter.digital service is the large file size download of around 8 MB. At that size, it's not practical to download the app over mobile data in many parts of the world. It would be both too expensive as well as too slow. On the other hand, the user does not have to upload his file to a server and then download that file again. If the user's file size is larger than 4MB, then in terms of bandwidth cost, this FileConverter.digital app is actually a win for them.
