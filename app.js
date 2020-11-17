// I really don't wanna use jQuery.
var q = function(s /*string*/) { return document.querySelectorAll(s); }

//-----------------------------------------------------------------------------
// FFMPEG utils.
//-----------------------------------------------------------------------------

var ffmpeg = null;

// Helper function to check existence of file.
function fileexists(ffmpeg, f /*string*/) {
  try {
    var R = ffmpeg.FS('stat', f);
    return true;
  } catch(e) {
    return false;
  }
  return false;
}

function newffmpeg(donecb) {
  var result = FFmpeg.createFFmpeg({
    corePath: "thirdparty/ffmpeg-core.js",
    log: true,
  });
  var P = result.load();
  if (typeof donecb !== 'undefined') { P.then(donecb); }
  return result;
}

//-----------------------------------------------------------------------------
// Media Player utils.
//-----------------------------------------------------------------------------

aa.addEventListener('error',function(e){ 	console.error(e); });

function getmime(b /*MP4 fragment as Uint8Array*/) {
  // Using mux.js was key.
  var tracks = muxjs.mp4.probe.tracks(b);
  var result = 'video/mp4; codecs="';
  for (var i = 0; i < tracks.length; ++i) {
    result += tracks[i].codec;
    if (i < tracks.length-1) { result += ", "; }
  }
  result += '"';
  return result;
}

function Streamer(ffmpeg) {
  var that = this;

  this.init = function(ffmpeg) {
    this.ffmpeg = ffmpeg;

    // Set source of media player to MediaSource.
    this.M = new MediaSource();
    aa.src = URL.createObjectURL(this.M);

    // Whether the stream has ended.
    this.endOfStream = false;

    // Queue of buffers to add to SourceBuffer.
    this.buffers = [];

    // The mp4 segment to be read. Initializes to the zeroth segment.
    this.F = 0;

    // Try to read a file periodically.
    this.I = setInterval(function() { that.tryReadFile(); }, 1000);

    // Auto-play the video.
    aa.play();
  }

  this.addSourceBuffer = function(F /*MP4 fragment as Uint8Array*/) {
    window.A = F; // For debug purposes only.
    this.S = this.M.addSourceBuffer(getmime(F));
    this.S.addEventListener('error', function(e) { console.error(e); });
    this.S.addEventListener('updateend', function() { that.addbuffer(); });
    this.M.duration = 5; // Initialize to segment length of 5 seconds.
  }

  this.tryReadFile = function() {
    console.log('tryReadFile', this.F);
    while (fileexists(this.ffmpeg, (this.F+1)+'.mp4')) { this.readFile(); }
  }

  this.readFile = function() {
    var F = this.ffmpeg.FS('readFile', this.F+'.mp4');
    this.ffmpeg.FS('unlink', this.F+'.mp4'); // To conserve filesystem memory.
    console.log('readFile', this.F, F);
    if (this.F === 0) { this.addSourceBuffer(F); }
    F.num = this.F;
    this.buffers.push(F);
    this.F++;
    if (!this.S.updating) { this.addbuffer(); }
  }

  this.addbuffer = function() {
    console.log('updateend');
    if (this.buffers.length <= 0) {
      if (this.endOfStream) { this.M.endOfStream(); }
      return;
    }
    var F = this.buffers.shift();

    // It's possible this throws:
    // Uncaught DOMException: Failed to set the 'duration' property on
    // 'MediaSource': The MediaSource's readyState is not 'open'.
    //
    // It's possible if the user opened a new file that replaced this current
    // video.
    //
    // In this case, need to cancel the interval check so that it doesn't burn
    // CPU.
    try { this.M.duration = 5*F.num+5; }
    catch(ex) { clearInterval(this.I); return; }

    this.S.timestampOffset = 5*F.num;
    this.S.appendBuffer(F.buffer);
    if (this.endOfStream && this.buffers.length === 0) { this.M.endOfStream();}
  }

  this.readLast = function() {
    console.log('readLast', this.F);
    clearInterval(this.I);
    while (fileexists(this.ffmpeg, this.F+'.mp4')) { this.readFile(); }
    this.endOfStream = true;
  }
 
  this.init(ffmpeg);
}

//-----------------------------------------------------------------------------
// Google Analytics utils.
//-----------------------------------------------------------------------------

function _log(evname, data) {
  if (typeof ga !== 'undefined') { ga('send', 'event', evname, evname, data);}
}
function logFileUpload(fname /*string*/) { _log('fileupload', fname); }

//-----------------------------------------------------------------------------
// App.
//-----------------------------------------------------------------------------

// Returns filetype of filename such as "asdf.gif". Return is guaranteed to be
// lowercase.
function getFileType(fname /*string*/) {
  var parts = fname.split('.');
  if (parts.length <= 1) { return null; }
  return (parts[ parts.length-1 ]).toLowerCase();
}

function fetchURL(url) {
  return fetch(url).then(function(response) { return response.arrayBuffer();});
}

// Globals.
hasuploaded = false;
loadingdonefunc = null;

var app = new Vue({
  el: "#app",
  data: { fname: '', loadingapp: true, status: '', },
  methods: {
    noop: function(e) { e.preventDefault(); },
    openuploaddialog: function() { q('#uploader')[0].click(); },
    uploadvid: function(e) {
      logFileUpload(e.target.files[0].name);
      if (hasuploaded) {
        // We need a new instance of ffmpeg if the user is already playing.
        var that = this;
        ffmpeg = newffmpeg(function() { that.loadfile(e); });
      } else {
        hasuploaded = true;
        this.loadfile(e);
      }
    },

    loadfile: function(e) {
      var that = this;
      var el = e.target;
      var file = el.files[0];
      var name = file.name;
      this.fname = name;
      this.status = 'Loading file...';
      if (!this.loadingapp) { this.loaddone(this.fname, file); }
      else {
        loadingdonefunc = function() {
          that.loaddone(that.fname, file); }
        alert('Please wait 30-60 seconds for our 8 MB app to finish downloading. Your file will automatically start converting once the download is done\n\nThank you for your understanding.');
      }
    },

    loaddone: function(fname /*string*/, file) {
      var that = this;
      file.arrayBuffer().then(function(b /*ArrayBuffer*/) {
        var a = new Uint8Array(b, 0, b.byteLength);
        that.startplaying(fname, a);
      });
    },

    startplaying: function(fname, file /*Uint8Array*/) {
      var fname2 = 'input.' + getFileType(fname);
      ffmpeg.FS('writeFile', fname2, file);

      this.status = 'Started playing file...might need to wait a few seconds.';

      var P = ffmpeg.run(
        // Input file.
        '-i', fname2,

        // Faster encoding.
        '-g', '1',

        // We need to ask each segment to encode with these movflags which
        // allows streaming using MediaSource in the browser.
        '-segment_format_options',
        'movflags=frag_keyframe+empty_moov+default_base_moof',

        // Encode 5 second segments.
        '-segment_time', '5',
        '-f', 'segment',

        // Files will be indexed like: 0.mp4, 1.mp4, 2.mp4.
        '%d.mp4');

      // // Other experimental ffmpeg files I was playing with for faster
      // // transcoding.
      // //
      // // This is more memory efficient but appears slower.
      // var P = ffmpeg.run('-i', fname2, '-force_key_frames', "expr:gte(t,n_forced*0.5)", '-segment_format_options', 'movflags=frag_keyframe+empty_moov+default_base_moof', '-segment_time', '5', '-f', 'segment', '%d.mp4');

      // S is set in the window context for easier debugging.
      window.S = new Streamer(ffmpeg);

      P.then(function() { S.readLast(); });
    },

    // Downloads a test file 'tests/$T.$T' to play.
    download: function(ftype /*string*/) {
      var that = this;
      var fname = 'tests/'+ftype+'.'+ftype;
      if (hasuploaded) {
        // We need a new instance of ffmpeg if the user is already playing.
        ffmpeg = newffmpeg(function() { that.startdownload(fname); });
      } else {
        hasuploaded = true;
        that.startdownload(fname);
      }
    },

    startdownload: function(fname /*string*/) {
      var that = this;
      this.status = 'Started downloading file...';
      fetchURL(fname).then(function(b /*ArrayBuffer*/) {
        var a = new Uint8Array(b, 0, b.byteLength);
        that.startplaying(fname, a);
      });
    },
  },

  mounted: function() {
    this.loadingapp = true;
    var that = this;
    ffmpeg = newffmpeg(function() {
      that.loadingapp = false;
      if (loadingdonefunc) { loadingdonefunc(); }
    });
  },
});

// TODO:
// - should check for wasm compatibility.
