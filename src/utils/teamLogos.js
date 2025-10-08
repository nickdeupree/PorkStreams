import { APP_CATEGORIES } from '../config/categoryMappings';

// Respect Vite's base URL so assets resolve correctly in dev and packaged builds.
const VITE_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
  ? import.meta.env.BASE_URL
  : '/';

const LOGO_BASE_PATH = `${VITE_BASE.replace(/\/$/, '')}/logos`;

const normalizeTeamName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const createLookup = (folder, leagueFile, teams) => {
  const map = new Map();
  teams.forEach(({ file, aliases }) => {
    aliases.forEach((alias) => {
      const key = normalizeTeamName(alias);
      if (key && !map.has(key)) {
        map.set(key, `${LOGO_BASE_PATH}/${folder}/${file}`);
      }
    });
  });

  return {
    leagueLogo: `${LOGO_BASE_PATH}/${folder}/${leagueFile}`,
    map
  };
};

const LOGO_CONFIG = {
  [APP_CATEGORIES.BASKETBALL]: createLookup('basketball', 'nba.png', [
    { file: 'hawks.png', aliases: ['atlanta hawks', 'hawks'] },
    { file: 'celtics.png', aliases: ['boston celtics', 'celtics'] },
    { file: 'nets.png', aliases: ['brooklyn nets', 'nets'] },
    { file: 'hornets.png', aliases: ['charlotte hornets', 'hornets'] },
    { file: 'bulls.png', aliases: ['chicago bulls', 'bulls'] },
    { file: 'cavaliers.png', aliases: ['cleveland cavaliers', 'cleveland cavs', 'cavaliers', 'cavs'] },
    { file: 'mavericks.png', aliases: ['dallas mavericks', 'dallas mavs', 'mavericks', 'mavs'] },
    { file: 'nuggets.png', aliases: ['denver nuggets', 'nuggets'] },
    { file: 'pistons.png', aliases: ['detroit pistons', 'pistons'] },
    { file: 'goldenState.png', aliases: ['golden state warriors', 'gs warriors', 'warriors', 'gsw'] },
    { file: 'rockets.png', aliases: ['houston rockets', 'rockets'] },
    { file: 'pacers.png', aliases: ['indiana pacers', 'pacers'] },
    { file: 'clippers.png', aliases: ['los angeles clippers', 'la clippers', 'clippers'] },
    { file: 'lakers.png', aliases: ['los angeles lakers', 'la lakers', 'lakers'] },
    { file: 'grizzlies.png', aliases: ['memphis grizzlies', 'grizzlies'] },
    { file: 'heat.png', aliases: ['miami heat', 'heat'] },
    { file: 'bucks.png', aliases: ['milwaukee bucks', 'bucks'] },
    { file: 'timberwolves.png', aliases: ['minnesota timberwolves', 'timberwolves', 'wolves'] },
    { file: 'pelicans.png', aliases: ['new orleans pelicans', 'pelicans'] },
    { file: 'knicks.png', aliases: ['new york knicks', 'ny knicks', 'knicks'] },
    { file: 'thunder.png', aliases: ['oklahoma city thunder', 'okc thunder', 'thunder', 'okc'] },
    { file: 'magic.png', aliases: ['orlando magic', 'magic'] },
    { file: '76ers.png', aliases: ['philadelphia 76ers', '76ers', 'sixers', 'philly 76ers'] },
    { file: 'suns.png', aliases: ['phoenix suns', 'suns'] },
    { file: 'trailBlazers.png', aliases: ['portland trail blazers', 'trail blazers', 'blazers'] },
    { file: 'kings.png', aliases: ['sacramento kings', 'kings'] },
    { file: 'spurs.png', aliases: ['san antonio spurs', 'spurs', 'sa spurs'] },
    { file: 'raptors.png', aliases: ['toronto raptors', 'raptors'] },
    { file: 'jazz.png', aliases: ['utah jazz', 'jazz'] },
    { file: 'wizards.png', aliases: ['washington wizards', 'wizards'] }
  ]),
  [APP_CATEGORIES.WOMENS_BASKETBALL]: createLookup('womens%20basketball', 'wnba.png', [
    { file: 'aces.png', aliases: ['las vegas aces', 'vegas aces', 'aces'] },
    { file: 'dream.png', aliases: ['atlanta dream', 'dream'] },
    { file: 'fever.png', aliases: ['indiana fever', 'fever'] },
    { file: 'fire.png', aliases: ['portland fire', 'fire'] },
    { file: 'liberty.png', aliases: ['new york liberty', 'ny liberty', 'liberty'] },
    { file: 'lynx.png', aliases: ['minnesota lynx', 'lynx'] },
    { file: 'mercury.png', aliases: ['phoenix mercury', 'mercury'] },
    { file: 'mystics.png', aliases: ['washington mystics', 'mystics'] },
    { file: 'sky.png', aliases: ['chicago sky', 'sky'] },
    { file: 'sparks.png', aliases: ['los angeles sparks', 'la sparks', 'sparks'] },
    { file: 'storm.png', aliases: ['seattle storm', 'storm'] },
    { file: 'sun.png', aliases: ['connecticut sun', 'sun'] },
    { file: 'tempo.png', aliases: ['toronto tempo', 'tempo'] },
    { file: 'valkyries.png', aliases: ['golden state valkyries', 'bay area valkyries', 'valkyries'] },
    { file: 'wings.png', aliases: ['dallas wings', 'wings'] }
  ]),
  [APP_CATEGORIES.FOOTBALL]: createLookup('football', 'nfl.gif', [
    { file: '49ers.png', aliases: ['san francisco 49ers', 'sf 49ers', '49ers'] },
    { file: 'bears.png', aliases: ['chicago bears', 'bears'] },
    { file: 'bengals.png', aliases: ['cincinnati bengals', 'bengals'] },
    { file: 'bills.png', aliases: ['buffalo bills', 'bills'] },
    { file: 'buccaneers.png', aliases: ['tampa bay buccaneers', 'buccaneers', 'bucs', 'tampa bay bucs'] },
    { file: 'cardinals.png', aliases: ['arizona cardinals', 'cardinals'] },
    { file: 'chargers.png', aliases: ['los angeles chargers', 'la chargers', 'chargers'] },
    { file: 'chiefs.png', aliases: ['kansas city chiefs', 'chiefs'] },
    { file: 'colts.png', aliases: ['indianapolis colts', 'colts'] },
    { file: 'commanders.png', aliases: ['washington commanders', 'commanders'] },
    { file: 'dolphins.png', aliases: ['miami dolphins', 'dolphins'] },
    { file: 'eagles.png', aliases: ['philadelphia eagles', 'eagles'] },
    { file: 'falcons.png', aliases: ['atlanta falcons', 'falcons'] },
    { file: 'giants.png', aliases: ['new york giants', 'ny giants', 'giants'] },
    { file: 'jaguars.png', aliases: ['jacksonville jaguars', 'jaguars', 'jags'] },
    { file: 'jets.png', aliases: ['new york jets', 'ny jets', 'jets'] },
    { file: 'lions.png', aliases: ['detroit lions', 'lions'] },
    { file: 'packers.png', aliases: ['green bay packers', 'packers'] },
    { file: 'panthers.png', aliases: ['carolina panthers', 'panthers'] },
    { file: 'patriots.png', aliases: ['new england patriots', 'patriots', 'pats'] },
    { file: 'raiders.png', aliases: ['las vegas raiders', 'raiders'] },
    { file: 'rams.png', aliases: ['los angeles rams', 'la rams', 'rams'] },
    { file: 'ravens.png', aliases: ['baltimore ravens', 'ravens'] },
    { file: 'saints.png', aliases: ['new orleans saints', 'saints'] },
    { file: 'seahawks.png', aliases: ['seattle seahawks', 'seahawks', 'hawks'] },
    { file: 'steelers.png', aliases: ['pittsburgh steelers', 'steelers'] },
    { file: 'texans.png', aliases: ['houston texans', 'texans'] },
    { file: 'titans.png', aliases: ['tennessee titans', 'titans'] },
    { file: 'vikings.png', aliases: ['minnesota vikings', 'vikings'] }
  ]),
  [APP_CATEGORIES.BASEBALL]: createLookup('baseball', 'mlb.png', [
    { file: 'angels.png', aliases: ['los angeles angels', 'la angels', 'angels', 'los angeles angels of anaheim'] },
    { file: 'astros.png', aliases: ['houston astros', 'astros'] },
    { file: 'athletics.png', aliases: ['oakland athletics', 'oakland as', 'athletics', 'as'] },
    { file: 'blueJays.png', aliases: ['toronto blue jays', 'blue jays', 'jays'] },
    { file: 'braves.png', aliases: ['atlanta braves', 'braves'] },
    { file: 'brewers.png', aliases: ['milwaukee brewers', 'brewers', 'brew crew'] },
    { file: 'cardinals.png', aliases: ['st louis cardinals', 'st. louis cardinals', 'cardinals'] },
    { file: 'cubs.png', aliases: ['chicago cubs', 'cubs'] },
    { file: 'diamondbacks.png', aliases: ['arizona diamondbacks', 'diamondbacks', 'dbacks', 'd-backs'] },
    { file: 'dodgers.png', aliases: ['los angeles dodgers', 'la dodgers', 'dodgers'] },
    { file: 'giants.png', aliases: ['san francisco giants', 'sf giants', 'giants'] },
    { file: 'guardians.png', aliases: ['cleveland guardians', 'guardians'] },
    { file: 'mariners.png', aliases: ['seattle mariners', 'mariners', 'ms'] },
    { file: 'marlins.png', aliases: ['miami marlins', 'marlins'] },
    { file: 'mets.png', aliases: ['new york mets', 'ny mets', 'mets'] },
    { file: 'nationals.png', aliases: ['washington nationals', 'nationals', 'nats'] },
    { file: 'orioles.png', aliases: ['baltimore orioles', 'orioles', 'os'] },
    { file: 'padres.png', aliases: ['san diego padres', 'padres', 'sd padres'] },
    { file: 'phillies.png', aliases: ['philadelphia phillies', 'phillies', 'phils'] },
    { file: 'pirates.png', aliases: ['pittsburgh pirates', 'pirates', 'buccos'] },
    { file: 'rangers.png', aliases: ['texas rangers', 'rangers'] },
    { file: 'rays.png', aliases: ['tampa bay rays', 'rays'] },
    { file: 'redSox.png', aliases: ['boston red sox', 'red sox'] },
    { file: 'reds.png', aliases: ['cincinnati reds', 'reds'] },
    { file: 'rockies.png', aliases: ['colorado rockies', 'rockies'] },
    { file: 'royals.png', aliases: ['kansas city royals', 'royals'] },
    { file: 'tigers.png', aliases: ['detroit tigers', 'tigers'] },
    { file: 'twins.png', aliases: ['minnesota twins', 'twins'] },
    { file: 'whiteSox.png', aliases: ['chicago white sox', 'white sox'] },
    { file: 'yankees.png', aliases: ['new york yankees', 'ny yankees', 'yankees'] }
  ]),
  [APP_CATEGORIES.HOCKEY]: createLookup('hockey', 'nhl.png', [
    { file: 'avalanche.png', aliases: ['colorado avalanche', 'avalanche', 'avs'] },
    { file: 'blackhawks.png', aliases: ['chicago blackhawks', 'blackhawks', 'hawks'] },
    { file: 'blueJackets.png', aliases: ['columbus blue jackets', 'blue jackets'] },
    { file: 'blues.png', aliases: ['st louis blues', 'st. louis blues', 'blues'] },
    { file: 'bruins.png', aliases: ['boston bruins', 'bruins'] },
    { file: 'canadiens.png', aliases: ['montreal canadiens', 'canadiens', 'habs'] },
    { file: 'canucks.png', aliases: ['vancouver canucks', 'canucks'] },
    { file: 'capitals.png', aliases: ['washington capitals', 'capitals', 'caps'] },
    { file: 'devils.png', aliases: ['new jersey devils', 'devils'] },
    { file: 'ducks.png', aliases: ['anaheim ducks', 'ducks'] },
    { file: 'flames.png', aliases: ['calgary flames', 'flames'] },
    { file: 'flyers.png', aliases: ['philadelphia flyers', 'flyers'] },
    { file: 'hurricanes.png', aliases: ['carolina hurricanes', 'hurricanes', 'canes'] },
    { file: 'islanders.png', aliases: ['new york islanders', 'ny islanders', 'islanders'] },
    { file: 'jets.png', aliases: ['winnipeg jets', 'jets'] },
    { file: 'kings.png', aliases: ['los angeles kings', 'la kings', 'kings'] },
    { file: 'knights.png', aliases: ['vegas golden knights', 'golden knights', 'vgk', 'knights'] },
    { file: 'kraken.png', aliases: ['seattle kraken', 'kraken'] },
    { file: 'lightning.png', aliases: ['tampa bay lightning', 'lightning', 'bolts'] },
    { file: 'mammoth.png', aliases: ['colorado mammoth', 'mammoth'] },
    { file: 'mapleLeafs.png', aliases: ['toronto maple leafs', 'maple leafs', 'leafs'] },
    { file: 'oilers.png', aliases: ['edmonton oilers', 'oilers'] },
    { file: 'panthers.png', aliases: ['florida panthers', 'panthers'] },
    { file: 'penguins.png', aliases: ['pittsburgh penguins', 'penguins', 'pens'] },
    { file: 'predators.png', aliases: ['nashville predators', 'predators', 'preds'] },
    { file: 'rangers.png', aliases: ['new york rangers', 'ny rangers', 'rangers'] },
    { file: 'redWings.png', aliases: ['detroit red wings', 'red wings'] },
    { file: 'sabres.png', aliases: ['buffalo sabres', 'sabres'] },
    { file: 'senators.png', aliases: ['ottawa senators', 'senators', 'sens'] },
    { file: 'sharks.png', aliases: ['san jose sharks', 'sharks'] },
    { file: 'stars.png', aliases: ['dallas stars', 'stars'] },
    { file: 'wild.png', aliases: ['minnesota wild', 'wild'] }
  ])
};

const hasMatchupSeparator = (name) => /\b(?:vs\.?|v\.?|at|@)\b/i.test(name);

const splitTeams = (name) => {
  const sanitized = name
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+@\s+/gi, ' @ ')
    .replace(/\s+vs\.?\s+/gi, ' vs ')
    .replace(/\s+v\.?\s+/gi, ' vs ')
    .replace(/\s+at\s+/gi, ' at ')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/\s+/g, ' ');

  const parts = sanitized
    .split(/\s(?:vs|at|@)\s/i)
    .map((part) => part.replace(/\([^)]*\)/g, '').split(' - ')[0].trim())
    .filter(Boolean);

  return parts.slice(0, 2);
};

const extractMatchupContext = (rawName) => {
  if (!rawName) {
    return {
      name: '',
      hasMatchup: false,
      teams: []
    };
  }

  const name = rawName.split(':').slice(-1)[0].trim();
  const matchup = hasMatchupSeparator(name);
  const teams = matchup ? splitTeams(name) : [];

  return {
    name,
    hasMatchup: matchup,
    teams
  };
};

export const getTeamMatchDetails = (category, rawName) => {
  const config = LOGO_CONFIG[category];
  if (!config) {
    return {
      teams: [],
      leagueLogo: null,
      hasMatchup: false,
      teamLogoEntries: [],
      matchedTeams: []
    };
  }

  const { teams, hasMatchup } = extractMatchupContext(rawName);

  if (!hasMatchup || teams.length === 0) {
    return {
      teams: [],
      leagueLogo: config.leagueLogo,
      hasMatchup: hasMatchup,
      teamLogoEntries: [],
      matchedTeams: []
    };
  }

  return {
    teams,
    leagueLogo: config.leagueLogo,
    hasMatchup,
    teamLogoEntries: teams.map((teamName) => {
      const normalized = normalizeTeamName(teamName);
      const logo = config.map.get(normalized) || null;
      return {
        teamName,
        normalizedName: normalized,
        logo
      };
    }),
    matchedTeams: teams
      .map((teamName) => {
        const normalized = normalizeTeamName(teamName);
        const logo = config.map.get(normalized) || null;
        if (!logo) {
          return null;
        }
        return {
          teamName,
          normalizedName: normalized,
          logo
        };
      })
      .filter(Boolean)
  };
};

export const getTeamLogosForEvent = (category, rawName) => {
  const config = LOGO_CONFIG[category];
  if (!config) {
    return {
      logos: [],
      teams: [],
      leagueLogo: null,
      hasMatchup: false,
      matchedTeamCount: 0
    };
  }

  if (!rawName) {
    return {
      logos: [config.leagueLogo],
      teams: [],
      leagueLogo: config.leagueLogo,
      hasMatchup: false,
      matchedTeamCount: 0
    };
  }

  const matchDetails = getTeamMatchDetails(category, rawName);

  if (!matchDetails.hasMatchup || matchDetails.teamLogoEntries.length === 0) {
    return {
      logos: [config.leagueLogo],
      teams: matchDetails.teams,
      leagueLogo: config.leagueLogo,
      hasMatchup: matchDetails.hasMatchup,
      matchedTeamCount: matchDetails.matchedTeams.length
    };
  }

  const logos = matchDetails.teamLogoEntries.map((entry) => entry.logo || config.leagueLogo);

  return {
    logos,
    teams: matchDetails.teams,
    leagueLogo: config.leagueLogo,
    hasMatchup: matchDetails.hasMatchup,
    matchedTeamCount: matchDetails.matchedTeams.length
  };
};
