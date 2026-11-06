/* ============================================================
   MUSIC PAGE — TRACK LIST

   SHELVES
   Each shelf is one row on the page, top to bottom in this order.
   `color` is the stripe on that shelf's tape labels.

   TRACKS
   Tracks appear on their shelf in the order listed here.
   Fields (only `title`, `shelf`, and one of audio/youtube are required):

     title        Name on the tape and on the TV.
     shelf        Which shelf it goes on (one of the keys below).
     audio        Path to an audio file in this repo, e.g. 'media/music/personal_projects/song.mp3'
     youtube      A YouTube link or video ID. Plays on the TV screen.
                  (Give both `audio` and `youtube` to get a Video/Waveform toggle.)
     vertical     true for Shorts / vertical video. The TV stands up for these.
     label        Small text after the shelf name, e.g. a client or year.
     credit       Extra line under the title, e.g. collaborators.
     description  A sentence or two shown under the player.

   Example:
     { title: 'New Song', shelf: 'personal', audio: 'media/music/personal_projects/new-song.mp3',
       description: 'What it is and why I made it.' },
   ============================================================ */

const SHELVES = {
  gala:     { name: 'Lunar Gala Fashion Show',     color: '#5d7380' },
  game:     { name: 'Game music',     color: '#7f8b6c' },
  personal: { name: 'Personal works', color: '#b5826a' },
  improv:   { name: 'Improvisation',  color: '#c4a669' },
  sfx:      { name: 'Sound effects',  color: '#8f8c85' },
};

const TRACKS = [
  // ---- Lunar Gala ----
  { title: 'Re(veil)ar', shelf: 'gala', label: 'Lunar Gala 2026',
    audio: '',
    youtube: '',
    credit: 'Designers: Farah Daveau, Jason Asiedu',
    description: "Designer's Notes: Reveilar is a memory play. Each look is a fragment of a slumber party, drifting somewhere between reality and dream. It begins in the ordinary the act of showing up, of arriving with bags and secrets and expectations and then unravels into laughter, intimacy, play, and finally sleep. But even sleep is layered, moving from dream to nightmare before the sun rises again. The veils act as both shield and reveal, covering what’s private while hinting at what slips through. Together, the collection captures the slippage of memory: how a night isn’t remembered in order, but as a haze of textures, colors, and moods." },
  { title: 'Lustre', shelf: 'gala', label: 'Lunar Gala 2026',
    audio: '',
    youtube: '',
    credit: 'Designers: Annissa Gao, Milada Kweon',
    description: "Designer's Notes: Lustre turns nostalgia into something you can touch. Inspired by gems as memory-keepers, each look becomes a crystalline vessel that holds an emotion, then refracts it into color, texture, and movement. Some memories refract with sharp clarity; others blur into a soft glow. The garments do not quote the past; they transform it, turning intimate recollection into wearable light. Across the lineup, individual facets accumulate into a spectrum, revealing how different histories can shimmer in the same space." },
  { title: 'Immensity', shelf: 'gala', label: 'Lunar Gala 2025',
    audio: 'media/music/lunargala25/IMMENSITY_RYANZHANG_MASTER.wav',
    youtube: 'https://www.youtube.com/watch?v=ydbaQ68yX7Y',
    credit: 'Designers: Erika Egliskis, Sunny Guo',
    description: "Designer's Notes: Our ideal states of complete happiness are rooted in the places we call home: Japan and California. Our line, Immensity, transforms this vision of a physical paradise into wearable forms inspired by the sea, a vital aspect of these places. Having encountered the world's pitfalls and flaws, we recognize that there is no definitive end to our life journey—only the embrace of its continuous evolution." },

  // ---- Game Music ----
  { title: 'Desert Exploration', shelf: 'game', label: 'Tanbii',
    audio: 'media/music/videogamemusic/desert_exploration.wav',
    description: 'A percussive theme for exploring the desert areas.' },
  { title: 'Desolate Desert Village', shelf: 'game', label: 'Tanbii',
    audio: 'media/music/videogamemusic/desert_desolate.wav',
    description: 'Ambient and eerie, giving the abandoned village a sense of mystery through regional instrumentation.' },
  { title: 'Desert Oasis', shelf: 'game', label: 'Tanbii',
    audio: 'media/music/videogamemusic/desert_oasis.wav',
    description: 'A calm, spiritual track for resting at the oasis.' },
  { title: 'Racing Game Menu', shelf: 'game',
    audio: 'media/music/videogamemusic/menu.wav',
    description: 'An energetic menu theme for a cartoony racing game.' },
  { title: 'Shooter Loading Screen', shelf: 'game',
    audio: 'media/music/videogamemusic/loadingscreenshooter.wav',
    description: 'A UK grime-inspired loading theme for a fast-paced shooter.' },
  { title: 'Calm Theme', shelf: 'game',
    audio: 'media/music/videogamemusic/savannah.wav',
    description: 'An unused theme written for a contemplative cutscene.' },

  // ---- Personal works ----
  {
    title: 'Aurora', shelf: 'personal',
    audio: '',
    youtube: 'https://www.youtube.com/watch?v=4YVK7DoqUfI',
    description: 'The aurora borealis and the wintry feel of northern Sweden: a "snow motif" for the settling night, then rapid arpeggios as the lights fill the sky.' },
  { title: 'Cyberlove', shelf: 'personal', audio: 'media/music/personal_projects/cyberlove.wav',
    description: 'A synthwave pop beat, awaiting lyrics.' },
  { title: 'Pong', shelf: 'personal', audio: 'media/music/personal_projects/pong.wav',
    description: 'A winding track built on a ping-pong percussive motif.' },
  { title: 'Ambition', shelf: 'personal', audio: 'media/music/personal_projects/ambition.wav',
    description: 'An energetic trap beat with bells and synth leads.' },
  { title: 'Immerse', shelf: 'personal', audio: 'media/music/personal_projects/immerse.wav',
    description: 'Trap–electronic fusion inspired by Sam Gellaitry.' },
  { title: 'San Bushmen Beat', shelf: 'personal', audio: 'media/music/personal_projects/afrobeat.wav',
    description: 'Built from sampled chants of the San people of the Kalahari.' },

  // ---- Improvisation ----
  { title: 'Solo I', shelf: 'improv', vertical: true,
    youtube: 'https://www.youtube.com/shorts/ik8gDvygH88',
    description: 'An improvised solo.' },
  { title: 'Solo II', shelf: 'improv', vertical: true,
    youtube: 'https://www.youtube.com/shorts/CvqJLFOAzrM',
    description: 'An improvised solo.' },

  // ---- Sound effects ----
  { title: 'Quest Complete', shelf: 'sfx', label: 'Tanbii', audio: 'media/music/sfx/questcomplete.mp3',
    description: 'UI stinger for finishing a quest.' },
  { title: 'Bottle of Sand', shelf: 'sfx', label: 'Tanbii', audio: 'media/music/sfx/sand.mp3',
    description: 'Item pickup.' },
  { title: 'Page Turn', shelf: 'sfx', label: 'Tanbii', audio: 'media/music/sfx/pageturn.mp3',
    description: 'Journal interaction.' },
  { title: 'Button Tap', shelf: 'sfx', label: 'Tanbii', audio: 'media/music/sfx/button.mp3',
    description: 'Menu feedback.' },
  { title: 'Woman of the Fog', shelf: 'sfx', label: 'Game Creation Society', audio: 'media/music/sfx/fogwoman.mp3',
    description: 'Jumpscare.' },
  { title: 'Giant Creature', shelf: 'sfx', label: 'Game Creation Society', audio: 'media/music/sfx/walkerscare.mp3',
    description: 'Jumpscare.' },
  { title: 'Phantom Jellyfish', shelf: 'sfx', label: 'Game Creation Society', audio: 'media/music/sfx/jellyfishscare.mp3',
    description: 'Jumpscare.' },
  { title: 'Teleport Pad', shelf: 'sfx', label: 'Game Creation Society', audio: 'media/music/sfx/teleport.wav',
    description: 'Environmental loop.' },
];
