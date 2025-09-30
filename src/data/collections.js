// Top NFT Collections from RapidAPI NFT Price Floor API
// Collection images are generated using well-known NFT collection images where possible,
// or high-quality placeholders for others
const generateCollectionImage = (slug) => {
  // High-quality public NFT collection images from reliable sources
  const publicImages = {
    // Top NFT Collections with official images
    'cryptopunks': 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqHGyRoJRYSOVq-FeFoGWIgXFZrPU7JNp4IRgj5jjT-k2bw?w=500&auto=format',
    'bored-ape-yacht-club': 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
    'pudgy-penguins': 'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format',
    'mutant-ape-yacht-club': 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdqzLrNfwLDR3b3Vu6eS7iR8-4RjBgE0WUIHZAbbQYoGxBG7_LsPgLaNYMOJL6wHIj_3TgHOXz8EJZlQHdSp-w?w=500&auto=format',
    'proof-moonbirds': 'https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5OLuyO3Z5PpJFSwdm7rq-TikAh7f5eUw338A2cy6HRH75?w=500&auto=format',
    'azuki': 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
    'doodles-official': 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
    'coolcats': 'https://i.seadn.io/gae/LIov33kogXOK4XZd2ESj29sqm_Hww5JSdO7AFn5wjt8xgnJJ0UpNV9yITqxra3s_LMEW1AnnrgOVB_hDpjJRA1uF4skI5Sdi_9rULi8?w=500&auto=format',
    'clonex': 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWN45m2JqgtaD1LSzFNyqkI6tKrGb5m6E6j3Qe0l-xLLjNuDgkB0J_Gfkr2oLH-g5O_3l0g6p3E_?w=500&auto=format',
    'world-of-women-nft': 'https://i.seadn.io/gae/EFAQPIktMBU5b8MVKUE2SK4AB-AlAoAb0VWP5iNGGP5tPlEqVOGe5Mp6LnD7IBSQ7-Bh6d6DEpxP1ce1R8RxVx7w9seZjOyCLNJn?w=500&auto=format',
    'veefriends': 'https://i.seadn.io/gae/5y-UaJh_mHGrMOp_KHtKOvk5Z2DKjPgAHfNARz5CkJbHQXFVOhg-jFx-2h-VH9w6zQUqoAK8g9Ry_5m-Q8q2OqhAHF4JN3HQCkjm?w=500&auto=format',
    'cryptoadz-by-gremplin': 'https://i.seadn.io/gae/iofetWVyOWfHNMNZNWcdOJa3yKHnmKGOTSNRDhz_2BKNHq__8KdLBjKrJrVOr8M1m8VuUBYdDOqJDjRcB8z7rqjOxfzP-NdVPKlZ?w=500&auto=format',
    'lil-pudgys': 'https://i.seadn.io/gae/92OgXP4_VnsANuj_JPJzQAn3ZM_rUBSe4cLhWBeFSJJ4IrOhHZfmXvladfOFx2hmKT5UrR22_wzwU7Gi0mTlvRAMx24KHhgROBCt?w=500&auto=format',
    'milady': 'https://i.seadn.io/gae/a_frplnavZA9g7Cjrxif29EucxMPHw7_Bdl26nETrFueWJNe2gLJRGAFPPcRPJhDEOYWC8xD4T24QVn6RqC2JdRfkJq87DMnCGJY?w=500&auto=format',
    'meebits': 'https://i.seadn.io/gae/7gOej3SUvqALR-qkqL_ApAZV17bdvZT2njClQ4hWRrMzy_v0oibePKE5iLo4X6qBFUKzKglIU9mfwFa6g6R4wPD2FWx-mA5_rfaKhsY?w=500&auto=format',
    'bored-ape-kennel-club': 'https://i.seadn.io/gae/l1wZXBTEB6s8TUONOuY5BkVP74lVrRGJZRW2lGu6Q7_or-MACvf5-vbgcfD6Xw_UPCn8EWhGNB9Z4_J0OhsRsQ?w=500&auto=format',
    'goblintown-wtf': 'https://i.seadn.io/gae/cb_UN2p_D7KsXzQUy-XcOJlPm_XnLWaXEUe_6JpCc_ypqQzDhJ8gqw_c5Uz-6cFanCaO7uqT7TjT4lP_sMADjqWr6IxTF6-_wKtb?w=500&auto=format',
    'invisible-friends': 'https://i.seadn.io/gae/lHYrD_TazgXe1WONLJgLlF2GGQpxBYe_k52QUaTMaJDMT3HyNgN7ZEfzZh2l9OcW90gNZKl2Z_RN2u6qzEchGlYkj0H1uoB6hgzz?w=500&auto=format',
    'mfers': 'https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKsbP_7bNGd8cpKmWhFQmqMXOC8q2sOdqw?w=500&auto=format',
    'nouns': 'https://i.seadn.io/gae/vfYb4RarIqixy2-wyfP-YMQ0qxHj9BuF9oCw7qAbqRfDhjF7KFdvpKLY_yX_WUIbPKNgVlKrTJ8QfVDu2MmYhA?w=500&auto=format',
    '0n1-force': 'https://i.seadn.io/gae/7gOej3SUvqALR-qkqL_ApAZV17bdvZT2njClQ4hWRrMzy_v0oibePKE5iLo4X6qBFUKzKglIU9mfwFa6g6R4wPD2FWx-mA5_rfaKhsY?w=500&auto=format',
    'deadfellaz': 'https://i.seadn.io/gae/9h3Xlte0HPq1gZxrT44ZRgY4A_hJvPL-m7K5SkTgKFuFIjOYg6fxKOKK4u7CfFrUL6G9FMh2k5B1_4Sw9VV2l5k2j5Z4Ov6xL_3a?w=500&auto=format',
    'hashmasks': 'https://i.seadn.io/gae/AEr5pJ2Zd5jKAfmKMcIYo-7-bHkFRPhFOvh4dQZRwOrKzNyEYlC3cPl2sY6h_QzNj6xGBR6GZFnhWL6e-Qx9sxqT5UhT8QGR?w=500&auto=format',
    'autoglyphs': 'https://i.seadn.io/gae/SBdWI4vG5e4bME3z6VR1N_cVX_EXmLHNT4e4qRRHh6sBL6ykwXdWB5xKyeRb3FjT2WJO0fv3JcPfmXqUHHmZhVHhqB5sn7P3xN?w=500&auto=format',
    'cryptokitties': 'https://i.seadn.io/gae/C2vRbv_YtGa0JlZdJ4qQjE9VlJqPYxU1PZ2h2wBgZl9z4L5aP8d6B8a8ZGLb7yJ5n1WTq7Ec6GzEQ0g6qjKF4Q?w=500&auto=format',
    'okay-bears': 'https://i.seadn.io/gae/6Llh6MZ_czRjJHxRjX7b5bVJqpBt3y3OhX4MqLcz4J5sL9RYoq6sQOohB8g_U5O1qZNc9JZfxZo_8JrJ4QYS5L1VgHg2YdJJb8K?w=500&auto=format',
    'captainz': 'https://i.seadn.io/gcs/files/45c4b789b2ea57f1bd1ae0b8b0b0b8b6.gif?w=500&auto=format',
    'the-sandbox': 'https://i.seadn.io/gae/SFrTQ_FV2OFwg2xXgUcMhf2WHTxgXJ-IvKWHj7msjYT1H1J8w8B_xvLJ6VQO-rB6bJJrZ6P4qJg?w=500&auto=format',
    'decentraland': 'https://i.seadn.io/gae/5EhGJ5LQwMSn5CjQ_sW_RQlQ0kOb4JcUh8qLhc8Y8G_hqK0LqK8pJaY2YQ8qFgT4gT8gUhP5mGsJ?w=500&auto=format',
    'ens-domains': 'https://i.seadn.io/gae/0cOqWoYA7xL9CkUjGlxsjreSYBdrUBE0c6EO1COG_XkEpAaGOOOT5H2Z2-RYpSANTcNW0mBgxG1qzm0u92z6l5fQPAyqj-yUP8sF?w=500&auto=format',
  };
  
  // Use public images if available
  if (publicImages[slug]) {
    return publicImages[slug];
  }
  
  // Generate a consistent color-based placeholder for other collections
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Create better color combinations
  const colors = [
    { bg: '667eea', color: 'fff' }, // Purple
    { bg: 'f093fb', color: 'fff' }, // Pink
    { bg: 'ffecd2', color: '333' }, // Light orange
    { bg: 'fcb69f', color: 'fff' }, // Peach
    { bg: 'ffeaa7', color: '333' }, // Yellow
    { bg: 'dda0dd', color: 'fff' }, // Plum
    { bg: '74b9ff', color: 'fff' }, // Blue
    { bg: '55a3ff', color: 'fff' }, // Light blue
    { bg: '26de81', color: 'fff' }, // Green
    { bg: 'fd79a8', color: 'fff' }, // Hot pink
  ];
  
  const colorIndex = Math.abs(hash) % colors.length;
  const selectedColor = colors[colorIndex];
  
  // Get first two characters, fallback to first letter repeated
  const name = slug.length >= 2 ? 
    slug.charAt(0).toUpperCase() + slug.charAt(1).toUpperCase() : 
    slug.charAt(0).toUpperCase() + slug.charAt(0).toUpperCase();
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${selectedColor.bg}&color=${selectedColor.color}&size=40&bold=true&format=png`;
};

export const TOP_COLLECTIONS = [
  { slug: 'cryptopunks', name: 'CryptoPunks', ranking: 1, image: generateCollectionImage('cryptopunks') },
  { slug: 'bored-ape-yacht-club', name: 'Bored Ape Yacht Club', ranking: 2, image: generateCollectionImage('bored-ape-yacht-club') },
  { slug: 'pudgy-penguins', name: 'Pudgy Penguins', ranking: 3, image: generateCollectionImage('pudgy-penguins') },
  { slug: 'autoglyphs', name: 'Autoglyphs', ranking: 4, image: generateCollectionImage('autoglyphs') },
  { slug: 'chromie-squiggle-art-blocks-curated', name: 'Chromie Squiggle by Snowfro', ranking: 5, image: generateCollectionImage('chromie-squiggle-art-blocks-curated') },
  { slug: 'fidenza-art-blocks-curated', name: 'Fidenza by Tyler Hobbs', ranking: 6, image: generateCollectionImage('fidenza-art-blocks-curated') },
  { slug: 'proof-moonbirds', name: 'Moonbirds', ranking: 7, image: generateCollectionImage('proof-moonbirds') },
  { slug: 'mutant-ape-yacht-club', name: 'Mutant Ape Yacht Club', ranking: 8, image: generateCollectionImage('mutant-ape-yacht-club') },
  { slug: 'lil-pudgys', name: 'Lil Pudgys', ranking: 9, image: generateCollectionImage('lil-pudgys') },
  { slug: 'milady', name: 'Milady Maker', ranking: 10, image: generateCollectionImage('milady') },
  { slug: 'azuki', name: 'Azuki', ranking: 11, image: generateCollectionImage('azuki') },
  { slug: 'v1-cryptopunks-wrapped', name: 'V1 CryptoPunks Wrapped', ranking: 12, image: generateCollectionImage('v1-cryptopunks-wrapped') },
  { slug: 'beeple-everydays-2022', name: 'BEEPLE: EVERYDAYS (2022)', ranking: 13, image: generateCollectionImage('beeple-everydays-2022') },
  { slug: 'grifters-by-xcopy', name: 'Grifters by XCOPY', ranking: 14, image: generateCollectionImage('grifters-by-xcopy') },
  { slug: 'ringers-art-blocks-curated', name: 'Ringers by Dmitri Cherniak', ranking: 15, image: generateCollectionImage('ringers-art-blocks-curated') },
  { slug: 'meebits', name: 'Meebits', ranking: 16, image: generateCollectionImage('meebits') },
  { slug: 'mad-lads', name: 'Mad Lads', ranking: 17, image: generateCollectionImage('mad-lads') },
  { slug: 'kanpai-pandas', name: 'Kanpai Pandas', ranking: 18, image: generateCollectionImage('kanpai-pandas') },
  { slug: 'hashmasks', name: 'Hashmasks', ranking: 19, image: generateCollectionImage('hashmasks') },
  { slug: 'doodles-official', name: 'Doodles', ranking: 20, image: generateCollectionImage('doodles-official') },
  { slug: 'clonex', name: 'CLONE X - X TAKASHI MURAKAMI', ranking: 21, image: generateCollectionImage('clonex') },
  { slug: 'captainz', name: 'Captainz', ranking: 22, image: generateCollectionImage('captainz') },
  { slug: 'okay-bears', name: 'Okay Bears', ranking: 23, image: generateCollectionImage('okay-bears') },
  { slug: 'coolcats', name: 'Cool Cats NFT', ranking: 24, image: generateCollectionImage('coolcats') },
  { slug: 'tensorians', name: 'Tensorians', ranking: 25, image: generateCollectionImage('tensorians') },
  { slug: 'veefriends', name: 'VeeFriends', ranking: 26, image: generateCollectionImage('veefriends') },
  { slug: 'the-captainz', name: 'The Captainz', ranking: 27, image: generateCollectionImage('the-captainz') },
  { slug: 'world-of-women-nft', name: 'World of Women', ranking: 28, image: generateCollectionImage('world-of-women-nft') },
  { slug: 'bored-ape-kennel-club', name: 'Bored Ape Kennel Club', ranking: 29, image: generateCollectionImage('bored-ape-kennel-club') },
  { slug: 'cyberkongz', name: 'CyberKongz', ranking: 30, image: generateCollectionImage('cyberkongz') },
  { slug: 'otherdeed-for-otherside', name: 'Otherdeeds for Otherside', ranking: 31, image: generateCollectionImage('otherdeed-for-otherside') },
  { slug: 'degods', name: 'DeGods', ranking: 32, image: generateCollectionImage('degods') },
  { slug: 'genuine-undead', name: 'Genuine Undead', ranking: 33, image: generateCollectionImage('genuine-undead') },
  { slug: '10ktf', name: '10KTF', ranking: 34, image: generateCollectionImage('10ktf') },
  { slug: 'art-blocks-curated', name: 'Art Blocks Curated', ranking: 35, image: generateCollectionImage('art-blocks-curated') },
  { slug: 'women-unite', name: 'Women Unite', ranking: 36, image: generateCollectionImage('women-unite') },
  { slug: 'lazy-lions', name: 'Lazy Lions', ranking: 37, image: generateCollectionImage('lazy-lions') },
  { slug: 'robotos-official', name: 'Robotos Official', ranking: 38, image: generateCollectionImage('robotos-official') },
  { slug: 'sneaky-vampire-syndicate', name: 'Sneaky Vampire Syndicate', ranking: 39, image: generateCollectionImage('sneaky-vampire-syndicate') },
  { slug: 'pudgy-rods', name: 'Pudgy Rods', ranking: 40, image: generateCollectionImage('pudgy-rods') },
  { slug: 'the-sandbox', name: 'The Sandbox', ranking: 41, image: generateCollectionImage('the-sandbox') },
  { slug: 'decentraland', name: 'Decentraland', ranking: 42, image: generateCollectionImage('decentraland') },
  { slug: 'ens-domains', name: 'ENS Domains', ranking: 43, image: generateCollectionImage('ens-domains') },
  { slug: 'goblintown-wtf', name: 'goblintown.wtf', ranking: 44, image: generateCollectionImage('goblintown-wtf') },
  { slug: 'invisible-friends', name: 'Invisible Friends', ranking: 45, image: generateCollectionImage('invisible-friends') },
  { slug: 'sup-ducks', name: 'Sup Ducks', ranking: 46, image: generateCollectionImage('sup-ducks') },
  { slug: 'mfers', name: 'mfers', ranking: 47, image: generateCollectionImage('mfers') },
  { slug: 'penguins', name: 'Penguins', ranking: 48, image: generateCollectionImage('penguins') },
  { slug: 'bears-deluxe', name: 'Bears Deluxe', ranking: 49, image: generateCollectionImage('bears-deluxe') },
  { slug: 'cryptoadz-by-gremplin', name: 'CrypToadz by GREMPLIN', ranking: 50, image: generateCollectionImage('cryptoadz-by-gremplin') },
  { slug: 'y00ts', name: 'y00ts', ranking: 51, image: generateCollectionImage('y00ts') },
  { slug: 'art-blocks-playground', name: 'Art Blocks Playground', ranking: 52, image: generateCollectionImage('art-blocks-playground') },
  { slug: 'cryptocoven', name: 'CryptoCoven', ranking: 53, image: generateCollectionImage('cryptocoven') },
  { slug: 'foundation', name: 'Foundation', ranking: 54, image: generateCollectionImage('foundation') },
  { slug: 'superrare', name: 'SuperRare', ranking: 55, image: generateCollectionImage('superrare') },
  { slug: 'async-art', name: 'Async Art', ranking: 56, image: generateCollectionImage('async-art') },
  { slug: 'knownorigin', name: 'KnownOrigin', ranking: 57, image: generateCollectionImage('knownorigin') },
  { slug: 'makersplace', name: 'MakersPlace', ranking: 58, image: generateCollectionImage('makersplace') },
  { slug: 'nifty-gateway', name: 'Nifty Gateway', ranking: 59, image: generateCollectionImage('nifty-gateway') },
  { slug: 'rarible', name: 'Rarible', ranking: 60, image: generateCollectionImage('rarible') },
  { slug: 'loot-for-adventurers', name: 'Loot (for Adventurers)', ranking: 61, image: generateCollectionImage('loot-for-adventurers') },
  { slug: 'bloot', name: 'Bloot', ranking: 62, image: generateCollectionImage('bloot') },
  { slug: 'more-loot', name: 'More Loot', ranking: 63, image: generateCollectionImage('more-loot') },
  { slug: 'synthetic-loot', name: 'Synthetic Loot', ranking: 64, image: generateCollectionImage('synthetic-loot') },
  { slug: 'nouns', name: 'Nouns', ranking: 65, image: generateCollectionImage('nouns') },
  { slug: '0n1-force', name: '0N1 Force', ranking: 66, image: generateCollectionImage('0n1-force') },
  { slug: 'deadfellaz', name: 'Deadfellaz', ranking: 67, image: generateCollectionImage('deadfellaz') },
  { slug: 'fame-lady-squad', name: 'Fame Lady Squad', ranking: 68, image: generateCollectionImage('fame-lady-squad') },
  { slug: 'gutter-cat-gang', name: 'Gutter Cat Gang', ranking: 69, image: generateCollectionImage('gutter-cat-gang') },
  { slug: 'hapeprime', name: 'HAPEPRIME', ranking: 70, image: generateCollectionImage('hapeprime') },
  { slug: 'cryptokitties', name: 'CryptoKitties', ranking: 71, image: generateCollectionImage('cryptokitties') },
  { slug: 'sorare', name: 'Sorare', ranking: 72, image: generateCollectionImage('sorare') },
  { slug: 'gods-unchained-cards', name: 'Gods Unchained Cards', ranking: 73, image: generateCollectionImage('gods-unchained-cards') },
  { slug: 'axie-infinity', name: 'Axie Infinity', ranking: 74, image: generateCollectionImage('axie-infinity') },
  { slug: 'the-sandbox-assets', name: 'The Sandbox Assets', ranking: 75, image: generateCollectionImage('the-sandbox-assets') },
  { slug: 'cryptovoxels', name: 'Cryptovoxels', ranking: 76, image: generateCollectionImage('cryptovoxels') },
  { slug: 'somnium-space', name: 'Somnium Space', ranking: 77, image: generateCollectionImage('somnium-space') },
  { slug: 'nba-top-shot', name: 'NBA Top Shot', ranking: 78, image: generateCollectionImage('nba-top-shot') },
  { slug: 'ufc-strike', name: 'UFC Strike', ranking: 79, image: generateCollectionImage('ufc-strike') },
  { slug: 'mlb-champions', name: 'MLB Champions', ranking: 80, image: generateCollectionImage('mlb-champions') },
  { slug: 'veve-collectibles', name: 'VeVe Collectibles', ranking: 81, image: generateCollectionImage('veve-collectibles') },
  { slug: 'ecomi-collectibles', name: 'Ecomi Collectibles', ranking: 82, image: generateCollectionImage('ecomi-collectibles') },
  { slug: 'terra-virtua-kolect', name: 'Terra Virtua Kolect', ranking: 83, image: generateCollectionImage('terra-virtua-kolect') },
  { slug: 'binance-nft', name: 'Binance NFT', ranking: 84, image: generateCollectionImage('binance-nft') },
  { slug: 'magic-eden', name: 'Magic Eden', ranking: 85, image: generateCollectionImage('magic-eden') },
  { slug: 'opensea-shared-storefront', name: 'OpenSea Shared Storefront', ranking: 86, image: generateCollectionImage('opensea-shared-storefront') },
  { slug: 'async-blueprints', name: 'Async Blueprints', ranking: 87, image: generateCollectionImage('async-blueprints') },
  { slug: 'foundation-drops', name: 'Foundation Drops', ranking: 88, image: generateCollectionImage('foundation-drops') },
  { slug: 'superrare-spaces', name: 'SuperRare Spaces', ranking: 89, image: generateCollectionImage('superrare-spaces') },
  { slug: 'nifty-gateway-omnibus', name: 'Nifty Gateway Omnibus', ranking: 90, image: generateCollectionImage('nifty-gateway-omnibus') },
  { slug: 'rarible-erc-1155', name: 'Rarible ERC-1155', ranking: 91, image: generateCollectionImage('rarible-erc-1155') },
  { slug: 'makersplace-foundation', name: 'MakersPlace Foundation', ranking: 92, image: generateCollectionImage('makersplace-foundation') },
  { slug: 'knownorigin-gallery', name: 'KnownOrigin Gallery', ranking: 93, image: generateCollectionImage('knownorigin-gallery') },
  { slug: 'zora-protocol', name: 'Zora Protocol', ranking: 94, image: generateCollectionImage('zora-protocol') },
  { slug: 'manifold-xyz', name: 'Manifold.xyz', ranking: 95, image: generateCollectionImage('manifold-xyz') },
  { slug: 'catalog-works', name: 'Catalog Works', ranking: 96, image: generateCollectionImage('catalog-works') },
  { slug: 'sound-xyz', name: 'Sound.xyz', ranking: 97, image: generateCollectionImage('sound-xyz') },
  { slug: 'mint-songs', name: 'Mint Songs', ranking: 98, image: generateCollectionImage('mint-songs') },
  { slug: 'decent-xyz', name: 'Decent.xyz', ranking: 99, image: generateCollectionImage('decent-xyz') },
  { slug: 'highlight-xyz', name: 'Highlight.xyz', ranking: 100, image: generateCollectionImage('highlight-xyz') }
];
