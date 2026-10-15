/*
 * Channels, in the order their buttons appear. Each is played on its own.
 * Keep at least ~20 videos in each so rounds don't repeat too much.
 */
window.VIDEO_GAP_CHANNELS = [
  { id: "pewdiepie", label: "PewDiePie", emoji: "👊" },
];

/*
 * Videos, grouped by channel (`channel`, one of the ids above).
 * `year` and `month` (1-12) are the upload date, as shown on the video's page.
 * `yt` is the YouTube video ID: the card shows its thumbnail (the emoji is the fallback
 * if the thumbnail can't load). `label` is the video's title, tidied up a little.
 */
window.VIDEO_GAP_VIDEOS = [
  // PewDiePie
  { year: 2010, month: 10, label: "Minecraft Multiplayer Fun", channel: "pewdiepie", emoji: "⛏️", yt: "9jeJbdVl2jI" },
  { year: 2011, month: 11, label: "Top 10 Scariest Moments of Gaming (300th video special)", channel: "pewdiepie", emoji: "😱", yt: "jXdCo3ISSw4" },
  { year: 2012, month: 2, label: "Happy Wheels - Part 1", channel: "pewdiepie", emoji: "🚲", yt: "XW99sBf4BUI" },
  { year: 2012, month: 3, label: "Happy Wheels - Funny Moments Montage", channel: "pewdiepie", emoji: "🛞", yt: "pXO76dbictU" },
  { year: 2012, month: 5, label: "Top Scariest Moments of Gaming, episode 8", channel: "pewdiepie", emoji: "👻", yt: "4dWIQ9N_tSc" },
  { year: 2013, month: 1, label: "Draw My Life - PewDiePie", channel: "pewdiepie", emoji: "✏️", yt: "6yBBO8PzWFI" },
  { year: 2013, month: 2, label: "Harlem Shake FAIL", channel: "pewdiepie", emoji: "🕺", yt: "FCjiMVHbXlQ" },
  { year: 2013, month: 6, label: "A Funny Montage", channel: "pewdiepie", emoji: "🤣", yt: "gRyPjRrjS34" },
  { year: 2013, month: 7, label: "Scariest game? - Outlast gameplay", channel: "pewdiepie", emoji: "🏚️", yt: "CrGa54rpvF4" },
  { year: 2013, month: 9, label: "Jabba the Hutt (PewDiePie Song) by Schmoyoho", channel: "pewdiepie", emoji: "🎤", yt: "lxw3C5HJ2XU" },
  { year: 2013, month: 11, label: "Worlds most offensive game? (Fridays With PewDiePie, Part 73)", channel: "pewdiepie", emoji: "📅", yt: "z-3xIw730pg" },
  { year: 2014, month: 1, label: "Flappy Bird - don't play this game!", channel: "pewdiepie", emoji: "🐦", yt: "lQz6xhlOt18" },
  { year: 2014, month: 2, label: "Game banned from kids? - Talking Angela", channel: "pewdiepie", emoji: "🐱", yt: "pzYxlKSgxh0" },
  { year: 2014, month: 4, label: "Funny Montage #2", channel: "pewdiepie", emoji: "😂", yt: "MkXVM6ad9nI" },
  { year: 2014, month: 8, label: "Five Nights at Freddy's - scariest game ever!", channel: "pewdiepie", emoji: "🐻", yt: "1-r1E-iF2EA" },
  { year: 2015, month: 5, label: "Charlie, Charlie challenge is real!?", channel: "pewdiepie", emoji: "✏️", yt: "ZaRRR7b6X0M" },
  { year: 2015, month: 9, label: "10 Billion Montage!", channel: "pewdiepie", emoji: "🔟", yt: "IrZm1CUydzo" },
  { year: 2016, month: 2, label: "Level 7 | I'm not crazy (Outlast IRL gameplay)", channel: "pewdiepie", emoji: "🔦", yt: "MsplPPW7tFo" },
  { year: 2016, month: 5, label: "The Diamond Play Button!! (Part 1)", channel: "pewdiepie", emoji: "💎", yt: "VY4wCi1pPkU" },
  { year: 2016, month: 7, label: "Pokémon Go | going too far? (BeastMaster 64, episode 1)", channel: "pewdiepie", emoji: "⚡", yt: "ATYXYBLD5uI" },
  { year: 2016, month: 7, label: "Brofist (PewDiePie Song, by Roomie)", channel: "pewdiepie", emoji: "👊", yt: "5pEPpNpbnCI" },
  { year: 2016, month: 10, label: "PPAP Pen Pineapple Apple Pen cringe", channel: "pewdiepie", emoji: "🍍", yt: "6HlMJO7WPR0" },
  { year: 2016, month: 12, label: "Deleting my channel", channel: "pewdiepie", emoji: "🗑️", yt: "Y39LE5ZoKjw" },
  { year: 2016, month: 12, label: "Bottle flip challenge!", channel: "pewdiepie", emoji: "🍾", yt: "lyl6ibqnyis" },
  { year: 2016, month: 12, label: "The Ruby Play Button / 50 million sub reward unbox", channel: "pewdiepie", emoji: "❤️", yt: "7Vj5M0qKh8g" },
  { year: 2017, month: 1, label: "You laugh? You lose! Challenge - YLYL #0001", channel: "pewdiepie", emoji: "😆", yt: "TS3dxL0E1kc" },
  { year: 2017, month: 1, label: "Resident Evil 7: Biohazard - Part 1", channel: "pewdiepie", emoji: "🧟", yt: "HduaXmGiRTQ" },
  { year: 2017, month: 6, label: "Jake Paul", channel: "pewdiepie", emoji: "🙄", yt: "TuIcBPm90aM" },
  { year: 2017, month: 6, label: "I won!!! + PUBG #1", channel: "pewdiepie", emoji: "🍗", yt: "p8Kp18WpxQw" },
  { year: 2017, month: 9, label: "My Response", channel: "pewdiepie", emoji: "🎙️", yt: "cLdxuaxaQwc" },
  { year: 2017, month: 12, label: "Why I'm not in YouTube Rewind 2017", channel: "pewdiepie", emoji: "⏪", yt: "w4AImq08j9o" },
  { year: 2018, month: 1, label: "Logan Paul", channel: "pewdiepie", emoji: "😬", yt: "nFmSepfF48o" },
  { year: 2018, month: 10, label: "bitch lasagna", channel: "pewdiepie", emoji: "🍝", yt: "6Dh-RL__uN4" },
  { year: 2018, month: 12, label: "YouTube Rewind 2018, but it's actually good", channel: "pewdiepie", emoji: "🔁", yt: "By_Cn5ixYLg" },
  { year: 2019, month: 2, label: "Will Smith hosts Meme Review w/ Elon Musk", channel: "pewdiepie", emoji: "👏", yt: "zpWYQ1YtgnI" },
  { year: 2019, month: 3, label: "Congratulations", channel: "pewdiepie", emoji: "🎉", yt: "PHgc8Q6qTjc" },
  { year: 2019, month: 4, label: "Ending the Subscribe to PewDiePie meme", channel: "pewdiepie", emoji: "🛑", yt: "Ah5MYGQBYRo" },
  { year: 2019, month: 6, label: "Minecraft Part 1", channel: "pewdiepie", emoji: "🟩", yt: "VGt-BZ-SxGI" },
  { year: 2019, month: 8, label: "Marzia & Felix - Wedding 19.08.2019", channel: "pewdiepie", emoji: "💍", yt: "7PIMiDcwNvc" },
  { year: 2019, month: 8, label: "I challenge the Ender Dragon in Minecraft (Ending) - Part 30", channel: "pewdiepie", emoji: "🐲", yt: "YVxaK8WQhJo" },
  { year: 2019, month: 9, label: "Unboxing 100 mil YouTube award!!", channel: "pewdiepie", emoji: "🏆", yt: "DYlesHOaPkY" },
  { year: 2019, month: 10, label: "Mine All Day (Minecraft music video)", channel: "pewdiepie", emoji: "🎵", yt: "UAlIq7BKNxg" },
  { year: 2019, month: 12, label: "YouTube Rewind 2019, but it's actually good", channel: "pewdiepie", emoji: "📼", yt: "diT6jc9flkc" },
  { year: 2020, month: 1, label: "It's been real, but I'm out! - LWIAY #00106", channel: "pewdiepie", emoji: "👋", yt: "IZXgjR9INsA" },
  { year: 2020, month: 5, label: "I hit 10 years of YouTube uploads!", channel: "pewdiepie", emoji: "🎂", yt: "429WCrxZqe0" },
  { year: 2020, month: 11, label: "Reviewing memes with KSI (Meme Review #86)", channel: "pewdiepie", emoji: "🖼️", yt: "xl125ZovpAA" },
  { year: 2025, month: 4, label: "We bought land in Japan", channel: "pewdiepie", emoji: "🗾", yt: "tMIDpbmFoL8" },
  { year: 2025, month: 4, label: "I installed Linux (so should you)", channel: "pewdiepie", emoji: "🐧", yt: "pVI_smLgTY0" },
  { year: 2025, month: 6, label: "I'm done with Google", channel: "pewdiepie", emoji: "🔍", yt: "u_Lxkt50xOg" },
  { year: 2025, month: 8, label: "Accidentally built a nuclear supercomputer.", channel: "pewdiepie", emoji: "🖥️", yt: "2JzOe1Hs26Q" },
  { year: 2025, month: 9, label: "They said moving to Japan was a mistake..", channel: "pewdiepie", emoji: "🗻", yt: "wG-o4rk_W64" },
  { year: 2025, month: 10, label: "Thanks for 15 years", channel: "pewdiepie", emoji: "🥳", yt: "OQUV6kEKwlk" },
  { year: 2026, month: 1, label: "I spent 24 hours drawing at an anime studio", channel: "pewdiepie", emoji: "🎨", yt: "2UN7IJvDqHk" },
  { year: 2026, month: 2, label: "I trained my own AI... it beat ChatGPT", channel: "pewdiepie", emoji: "🤖", yt: "aV4j5pXLP-I" },
  { year: 2026, month: 5, label: "Ending the vlogs.", channel: "pewdiepie", emoji: "📹", yt: "ea0X-DWVOZo" },
  { year: 2026, month: 6, label: "I tried to make a manga", channel: "pewdiepie", emoji: "📖", yt: "iRRpvuMG7AM" },
  { year: 2026, month: 9, label: "Thank you and goodbye.", channel: "pewdiepie", emoji: "🫡", yt: "H8g4B5ZN7LM" },
];
