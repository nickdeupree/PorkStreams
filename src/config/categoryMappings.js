/**
 * Category Mapping Configuration
 * Maps provider-specific category names to normalized app categories
 */

export const APP_CATEGORIES = {
  BASKETBALL: 'Basketball',
  WOMENS_BASKETBALL: "WNBA",
  SOCCER: 'Soccer',
  FOOTBALL: 'Football',
  BASEBALL: 'Baseball',
  HOCKEY: 'Hockey',
  FIGHTING: 'Fighting',
  TWENTY_FOUR_SEVEN: '24/7',
  MOVIES: 'Movies & TV'
};

export const CATEGORY_MAPPINGS = {
  daddystreams: {
    [APP_CATEGORIES.BASKETBALL]: ['NBA', 'NBA Preseason', 'NBA FINALS'],
    [APP_CATEGORIES.WOMENS_BASKETBALL]: ['WNBA', 'WNBA Preseason', 'WNBA FINALS'],
    [APP_CATEGORIES.FOOTBALL]: ['Am. Football (NFL)', 'Am. Football Preseason (NFL)'],
    [APP_CATEGORIES.SOCCER]: ['Football', 'Soccer'],
    [APP_CATEGORIES.BASEBALL]: ['Baseball (MLB)'],
    [APP_CATEGORIES.HOCKEY]: ['Ice Hockey (NHL)']
  },
  pptv: {
    [APP_CATEGORIES.BASKETBALL]: ['Basketball', 'NBA'],
    [APP_CATEGORIES.WOMENS_BASKETBALL]: ['WNBA', 'Women\'s Basketball', 'Womens Basketball'],
    [APP_CATEGORIES.FOOTBALL]: ['American Football', 'American Football (NFL)', 'NFL'],
    [APP_CATEGORIES.SOCCER]: ['Football', 'Soccer'],
    [APP_CATEGORIES.BASEBALL]: ['Baseball'],
    [APP_CATEGORIES.HOCKEY]: ['Ice Hockey'],
    [APP_CATEGORIES.FIGHTING]: ['Wrestling', 'UFC', 'Boxing', 'MMA'],
    [APP_CATEGORIES.TWENTY_FOUR_SEVEN]: ['24/7 Streams', '24/7', '247', 'Always Live']
  },
  sharkstreams: {
    [APP_CATEGORIES.BASKETBALL]: ['NBA'],
    [APP_CATEGORIES.WOMENS_BASKETBALL]: ['WNBA'],
    [APP_CATEGORIES.FOOTBALL]: ['NFL'],
    [APP_CATEGORIES.SOCCER]: ['Soccer', 'Football'],
    [APP_CATEGORIES.BASEBALL]: ['MLB'],
    [APP_CATEGORIES.HOCKEY]: ['NHL'],
    [APP_CATEGORIES.FIGHTING]: ['MMA', 'WWE', 'UFC', 'Boxing']
  },
  streamed: {
    [APP_CATEGORIES.BASKETBALL]: ['basketball'],
    [APP_CATEGORIES.WOMENS_BASKETBALL]: ['womens-basketball', 'women-basketball'],
    [APP_CATEGORIES.FOOTBALL]: ['american-football'],
    [APP_CATEGORIES.SOCCER]: ['soccer', 'football'],
    [APP_CATEGORIES.BASEBALL]: ['baseball'],
    [APP_CATEGORIES.HOCKEY]: ['hockey']
  }
};

export const PROVIDER_IDS = {
  DADDY_STREAMS: 'daddystreams',
  PPTV: 'pptv',
  SHARK_STREAMS: 'sharkstreams',
  STREAMED: 'streamed'
};
