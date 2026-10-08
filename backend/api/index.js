import {createRequire} from 'module'; const require = createRequire(import.meta.url);

// src/app.ts
import cors from "cors";
import express from "express";
import rateLimit2 from "express-rate-limit";
import helmet from "helmet";

// src/lib/db.ts
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/prisma/client.ts
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.10.0",
  "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
  "activeProvider": "postgresql",
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum AnimeStatus {\n  AIRING\n  FINISHED\n  UPCOMING\n  CANCELLED\n}\n\nenum AnimeType {\n  TV\n  MOVIE\n  OVA\n  ONA\n  SPECIAL\n}\n\nenum AnimeSeason {\n  WINTER\n  SPRING\n  SUMMER\n  FALL\n}\n\nenum ListStatus {\n  WATCHING\n  PLAN_TO_WATCH\n  COMPLETED\n  DROPPED\n}\n\nmodel User {\n  id           String   @id @default(cuid())\n  username     String\n  email        String?  @unique\n  passwordHash String?\n  googleId     String?  @unique\n  tokenHash    String?  @unique\n  isAdmin      Boolean  @default(false)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  progress      WatchProgress[]\n  watchlist     Watchlist[]\n  searchHistory SearchHistory[]\n  pushTokens    PushToken[]\n  notifPrefs    NotificationPrefs?\n}\n\nmodel Anime {\n  id               String       @id @default(cuid())\n  externalId       String?      @unique\n  title            String\n  englishTitle     String?\n  nativeTitle      String?\n  synonyms         String[]     @default([])\n  description      String       @default("")\n  coverImage       String?\n  bannerImage      String?\n  year             Int?\n  month            Int?\n  season           AnimeSeason?\n  status           AnimeStatus  @default(FINISHED)\n  type             AnimeType    @default(TV)\n  rating           Float?\n  popularity       Int          @default(0)\n  duration         Int?\n  episodeCount     Int?\n  studio           String?\n  startDate        DateTime?\n  /**\n   * When episodes were last synced from the provider; lets the sync resume across runs.\n   */\n  episodesSyncedAt DateTime?\n  createdAt        DateTime     @default(now())\n  updatedAt        DateTime     @updatedAt\n\n  genres    AnimeGenre[]\n  seasons   Season[]\n  episodes  Episode[]\n  progress  WatchProgress[]\n  watchlist Watchlist[]\n\n  @@index([title])\n  @@index([year])\n  @@index([season])\n  @@index([status])\n  @@index([type])\n  @@index([rating])\n  @@index([popularity])\n  @@index([startDate])\n  @@index([createdAt])\n  @@index([updatedAt])\n  @@index([year, season])\n}\n\nmodel Genre {\n  id    Int          @id @default(autoincrement())\n  name  String       @unique\n  anime AnimeGenre[]\n}\n\nmodel AnimeGenre {\n  animeId String\n  genreId Int\n  anime   Anime  @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  genre   Genre  @relation(fields: [genreId], references: [id], onDelete: Cascade)\n\n  @@id([animeId, genreId])\n  @@index([genreId])\n}\n\nmodel Season {\n  id       String    @id @default(cuid())\n  animeId  String\n  number   Int\n  title    String\n  anime    Anime     @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  episodes Episode[]\n\n  @@unique([animeId, number])\n}\n\nmodel Episode {\n  id            String    @id @default(cuid())\n  animeId       String\n  seasonId      String?\n  episodeNumber Int\n  title         String\n  description   String    @default("")\n  thumbnail     String?\n  releaseDate   DateTime?\n  duration      Int?\n  createdAt     DateTime  @default(now())\n\n  anime     Anime           @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  season    Season?         @relation(fields: [seasonId], references: [id], onDelete: SetNull)\n  subtitles Subtitle[]\n  sources   MediaSource[]\n  progress  WatchProgress[]\n\n  @@unique([animeId, seasonId, episodeNumber])\n  @@index([releaseDate])\n  @@index([animeId])\n  @@index([createdAt])\n}\n\nmodel Subtitle {\n  id        String  @id @default(cuid())\n  episodeId String\n  language  String\n  label     String\n  url       String\n  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)\n\n  @@index([episodeId])\n}\n\n// Media sources the owner has added manually and has rights to use.\nmodel MediaSource {\n  id        String   @id @default(cuid())\n  episodeId String\n  url       String\n  quality   String   @default("auto")\n  mimeType  String?\n  note      String?\n  createdAt DateTime @default(now())\n  episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)\n\n  @@index([episodeId])\n}\n\nmodel WatchProgress {\n  id              String   @id @default(cuid())\n  userId          String\n  animeId         String\n  episodeId       String\n  progressSeconds Int      @default(0)\n  durationSeconds Int      @default(0)\n  completed       Boolean  @default(false)\n  updatedAt       DateTime @updatedAt\n\n  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  anime   Anime   @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, episodeId])\n  @@index([userId, updatedAt])\n}\n\nmodel Watchlist {\n  id        String     @id @default(cuid())\n  userId    String\n  animeId   String\n  status    ListStatus @default(PLAN_TO_WATCH)\n  createdAt DateTime   @default(now())\n  updatedAt DateTime   @updatedAt\n\n  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)\n  anime Anime @relation(fields: [animeId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, animeId])\n  @@index([userId, status])\n}\n\nmodel SearchHistory {\n  id        String   @id @default(cuid())\n  userId    String\n  query     String\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, query])\n  @@index([userId, createdAt])\n}\n\nmodel PushToken {\n  id        String   @id @default(cuid())\n  userId    String\n  token     String   @unique\n  platform  String\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n}\n\nmodel NotificationPrefs {\n  userId          String  @id\n  newEpisodes     Boolean @default(true)\n  newAnime        Boolean @default(false)\n  recommendations Boolean @default(false)\n  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n}\n\nmodel SyncRun {\n  id            String    @id @default(cuid())\n  provider      String\n  startedAt     DateTime  @default(now())\n  finishedAt    DateTime?\n  animeAdded    Int       @default(0)\n  animeUpdated  Int       @default(0)\n  episodesAdded Int       @default(0)\n  errors        String[]  @default([])\n\n  @@index([startedAt])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"username","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"googleId","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"isAdmin","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"progress","kind":"object","type":"WatchProgress","relationName":"UserToWatchProgress"},{"name":"watchlist","kind":"object","type":"Watchlist","relationName":"UserToWatchlist"},{"name":"searchHistory","kind":"object","type":"SearchHistory","relationName":"SearchHistoryToUser"},{"name":"pushTokens","kind":"object","type":"PushToken","relationName":"PushTokenToUser"},{"name":"notifPrefs","kind":"object","type":"NotificationPrefs","relationName":"NotificationPrefsToUser"}],"dbName":null,"schema":null},"Anime":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"externalId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"englishTitle","kind":"scalar","type":"String"},{"name":"nativeTitle","kind":"scalar","type":"String"},{"name":"synonyms","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"bannerImage","kind":"scalar","type":"String"},{"name":"year","kind":"scalar","type":"Int"},{"name":"month","kind":"scalar","type":"Int"},{"name":"season","kind":"enum","type":"AnimeSeason"},{"name":"status","kind":"enum","type":"AnimeStatus"},{"name":"type","kind":"enum","type":"AnimeType"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"popularity","kind":"scalar","type":"Int"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"episodeCount","kind":"scalar","type":"Int"},{"name":"studio","kind":"scalar","type":"String"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"episodesSyncedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"genres","kind":"object","type":"AnimeGenre","relationName":"AnimeToAnimeGenre"},{"name":"seasons","kind":"object","type":"Season","relationName":"AnimeToSeason"},{"name":"episodes","kind":"object","type":"Episode","relationName":"AnimeToEpisode"},{"name":"progress","kind":"object","type":"WatchProgress","relationName":"AnimeToWatchProgress"},{"name":"watchlist","kind":"object","type":"Watchlist","relationName":"AnimeToWatchlist"}],"dbName":null,"schema":null},"Genre":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"name","kind":"scalar","type":"String"},{"name":"anime","kind":"object","type":"AnimeGenre","relationName":"AnimeGenreToGenre"}],"dbName":null,"schema":null},"AnimeGenre":{"fields":[{"name":"animeId","kind":"scalar","type":"String"},{"name":"genreId","kind":"scalar","type":"Int"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToAnimeGenre"},{"name":"genre","kind":"object","type":"Genre","relationName":"AnimeGenreToGenre"}],"dbName":null,"schema":null},"Season":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"number","kind":"scalar","type":"Int"},{"name":"title","kind":"scalar","type":"String"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToSeason"},{"name":"episodes","kind":"object","type":"Episode","relationName":"EpisodeToSeason"}],"dbName":null,"schema":null},"Episode":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"seasonId","kind":"scalar","type":"String"},{"name":"episodeNumber","kind":"scalar","type":"Int"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"thumbnail","kind":"scalar","type":"String"},{"name":"releaseDate","kind":"scalar","type":"DateTime"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToEpisode"},{"name":"season","kind":"object","type":"Season","relationName":"EpisodeToSeason"},{"name":"subtitles","kind":"object","type":"Subtitle","relationName":"EpisodeToSubtitle"},{"name":"sources","kind":"object","type":"MediaSource","relationName":"EpisodeToMediaSource"},{"name":"progress","kind":"object","type":"WatchProgress","relationName":"EpisodeToWatchProgress"}],"dbName":null,"schema":null},"Subtitle":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"episodeId","kind":"scalar","type":"String"},{"name":"language","kind":"scalar","type":"String"},{"name":"label","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"episode","kind":"object","type":"Episode","relationName":"EpisodeToSubtitle"}],"dbName":null,"schema":null},"MediaSource":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"episodeId","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"quality","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"note","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"episode","kind":"object","type":"Episode","relationName":"EpisodeToMediaSource"}],"dbName":null,"schema":null},"WatchProgress":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"episodeId","kind":"scalar","type":"String"},{"name":"progressSeconds","kind":"scalar","type":"Int"},{"name":"durationSeconds","kind":"scalar","type":"Int"},{"name":"completed","kind":"scalar","type":"Boolean"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserToWatchProgress"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToWatchProgress"},{"name":"episode","kind":"object","type":"Episode","relationName":"EpisodeToWatchProgress"}],"dbName":null,"schema":null},"Watchlist":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ListStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserToWatchlist"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToWatchlist"}],"dbName":null,"schema":null},"SearchHistory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"query","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SearchHistoryToUser"}],"dbName":null,"schema":null},"PushToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"token","kind":"scalar","type":"String"},{"name":"platform","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PushTokenToUser"}],"dbName":null,"schema":null},"NotificationPrefs":{"fields":[{"name":"userId","kind":"scalar","type":"String"},{"name":"newEpisodes","kind":"scalar","type":"Boolean"},{"name":"newAnime","kind":"scalar","type":"Boolean"},{"name":"recommendations","kind":"scalar","type":"Boolean"},{"name":"user","kind":"object","type":"User","relationName":"NotificationPrefsToUser"}],"dbName":null,"schema":null},"SyncRun":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"provider","kind":"scalar","type":"String"},{"name":"startedAt","kind":"scalar","type":"DateTime"},{"name":"finishedAt","kind":"scalar","type":"DateTime"},{"name":"animeAdded","kind":"scalar","type":"Int"},{"name":"animeUpdated","kind":"scalar","type":"Int"},{"name":"episodesAdded","kind":"scalar","type":"Int"},{"name":"errors","kind":"scalar","type":"String"}],"dbName":null,"schema":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","anime","_count","genre","genres","season","episode","subtitles","sources","progress","episodes","seasons","watchlist","searchHistory","pushTokens","notifPrefs","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Anime.findUnique","Anime.findUniqueOrThrow","Anime.findFirst","Anime.findFirstOrThrow","Anime.findMany","Anime.createOne","Anime.createMany","Anime.createManyAndReturn","Anime.updateOne","Anime.updateMany","Anime.updateManyAndReturn","Anime.upsertOne","Anime.deleteOne","Anime.deleteMany","_avg","_sum","Anime.groupBy","Anime.aggregate","Genre.findUnique","Genre.findUniqueOrThrow","Genre.findFirst","Genre.findFirstOrThrow","Genre.findMany","Genre.createOne","Genre.createMany","Genre.createManyAndReturn","Genre.updateOne","Genre.updateMany","Genre.updateManyAndReturn","Genre.upsertOne","Genre.deleteOne","Genre.deleteMany","Genre.groupBy","Genre.aggregate","AnimeGenre.findUnique","AnimeGenre.findUniqueOrThrow","AnimeGenre.findFirst","AnimeGenre.findFirstOrThrow","AnimeGenre.findMany","AnimeGenre.createOne","AnimeGenre.createMany","AnimeGenre.createManyAndReturn","AnimeGenre.updateOne","AnimeGenre.updateMany","AnimeGenre.updateManyAndReturn","AnimeGenre.upsertOne","AnimeGenre.deleteOne","AnimeGenre.deleteMany","AnimeGenre.groupBy","AnimeGenre.aggregate","Season.findUnique","Season.findUniqueOrThrow","Season.findFirst","Season.findFirstOrThrow","Season.findMany","Season.createOne","Season.createMany","Season.createManyAndReturn","Season.updateOne","Season.updateMany","Season.updateManyAndReturn","Season.upsertOne","Season.deleteOne","Season.deleteMany","Season.groupBy","Season.aggregate","Episode.findUnique","Episode.findUniqueOrThrow","Episode.findFirst","Episode.findFirstOrThrow","Episode.findMany","Episode.createOne","Episode.createMany","Episode.createManyAndReturn","Episode.updateOne","Episode.updateMany","Episode.updateManyAndReturn","Episode.upsertOne","Episode.deleteOne","Episode.deleteMany","Episode.groupBy","Episode.aggregate","Subtitle.findUnique","Subtitle.findUniqueOrThrow","Subtitle.findFirst","Subtitle.findFirstOrThrow","Subtitle.findMany","Subtitle.createOne","Subtitle.createMany","Subtitle.createManyAndReturn","Subtitle.updateOne","Subtitle.updateMany","Subtitle.updateManyAndReturn","Subtitle.upsertOne","Subtitle.deleteOne","Subtitle.deleteMany","Subtitle.groupBy","Subtitle.aggregate","MediaSource.findUnique","MediaSource.findUniqueOrThrow","MediaSource.findFirst","MediaSource.findFirstOrThrow","MediaSource.findMany","MediaSource.createOne","MediaSource.createMany","MediaSource.createManyAndReturn","MediaSource.updateOne","MediaSource.updateMany","MediaSource.updateManyAndReturn","MediaSource.upsertOne","MediaSource.deleteOne","MediaSource.deleteMany","MediaSource.groupBy","MediaSource.aggregate","WatchProgress.findUnique","WatchProgress.findUniqueOrThrow","WatchProgress.findFirst","WatchProgress.findFirstOrThrow","WatchProgress.findMany","WatchProgress.createOne","WatchProgress.createMany","WatchProgress.createManyAndReturn","WatchProgress.updateOne","WatchProgress.updateMany","WatchProgress.updateManyAndReturn","WatchProgress.upsertOne","WatchProgress.deleteOne","WatchProgress.deleteMany","WatchProgress.groupBy","WatchProgress.aggregate","Watchlist.findUnique","Watchlist.findUniqueOrThrow","Watchlist.findFirst","Watchlist.findFirstOrThrow","Watchlist.findMany","Watchlist.createOne","Watchlist.createMany","Watchlist.createManyAndReturn","Watchlist.updateOne","Watchlist.updateMany","Watchlist.updateManyAndReturn","Watchlist.upsertOne","Watchlist.deleteOne","Watchlist.deleteMany","Watchlist.groupBy","Watchlist.aggregate","SearchHistory.findUnique","SearchHistory.findUniqueOrThrow","SearchHistory.findFirst","SearchHistory.findFirstOrThrow","SearchHistory.findMany","SearchHistory.createOne","SearchHistory.createMany","SearchHistory.createManyAndReturn","SearchHistory.updateOne","SearchHistory.updateMany","SearchHistory.updateManyAndReturn","SearchHistory.upsertOne","SearchHistory.deleteOne","SearchHistory.deleteMany","SearchHistory.groupBy","SearchHistory.aggregate","PushToken.findUnique","PushToken.findUniqueOrThrow","PushToken.findFirst","PushToken.findFirstOrThrow","PushToken.findMany","PushToken.createOne","PushToken.createMany","PushToken.createManyAndReturn","PushToken.updateOne","PushToken.updateMany","PushToken.updateManyAndReturn","PushToken.upsertOne","PushToken.deleteOne","PushToken.deleteMany","PushToken.groupBy","PushToken.aggregate","NotificationPrefs.findUnique","NotificationPrefs.findUniqueOrThrow","NotificationPrefs.findFirst","NotificationPrefs.findFirstOrThrow","NotificationPrefs.findMany","NotificationPrefs.createOne","NotificationPrefs.createMany","NotificationPrefs.createManyAndReturn","NotificationPrefs.updateOne","NotificationPrefs.updateMany","NotificationPrefs.updateManyAndReturn","NotificationPrefs.upsertOne","NotificationPrefs.deleteOne","NotificationPrefs.deleteMany","NotificationPrefs.groupBy","NotificationPrefs.aggregate","SyncRun.findUnique","SyncRun.findUniqueOrThrow","SyncRun.findFirst","SyncRun.findFirstOrThrow","SyncRun.findMany","SyncRun.createOne","SyncRun.createMany","SyncRun.createManyAndReturn","SyncRun.updateOne","SyncRun.updateMany","SyncRun.updateManyAndReturn","SyncRun.upsertOne","SyncRun.deleteOne","SyncRun.deleteMany","SyncRun.groupBy","SyncRun.aggregate","AND","OR","NOT","id","provider","startedAt","finishedAt","animeAdded","animeUpdated","episodesAdded","errors","equals","has","hasEvery","hasSome","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","userId","newEpisodes","newAnime","recommendations","token","platform","createdAt","query","animeId","ListStatus","status","updatedAt","episodeId","progressSeconds","durationSeconds","completed","url","quality","mimeType","note","language","label","seasonId","episodeNumber","title","description","thumbnail","releaseDate","duration","number","genreId","name","every","some","none","externalId","englishTitle","nativeTitle","synonyms","coverImage","bannerImage","year","month","AnimeSeason","AnimeStatus","AnimeType","type","rating","popularity","episodeCount","studio","startDate","episodesSyncedAt","username","email","passwordHash","googleId","tokenHash","isAdmin","userId_query","userId_animeId","animeId_seasonId_episodeNumber","animeId_number","animeId_genreId","userId_episodeId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide","push"]'),
  graph: "7AaEAeABEQwAAMUDACAPAADGAwAgEAAAyQMAIBEAAMoDACASAADLAwAg-wEAAMgDADD8AQAAPgAQ_QEAAMgDADD-AQEAAAABmgJAAJEDACGfAkAAkQMAIckCAQCQAwAhygIBAAAAAcsCAQC9AwAhzAIBAAAAAc0CAQAAAAHOAiAAmQMAIQEAAAABACAOAwAAmgMAIAQAANIDACAJAADUAwAg-wEAAOEDADD8AQAAAwAQ_QEAAOEDADD-AQEAkAMAIZQCAQCQAwAhnAIBAJADACGfAkAAkQMAIaACAQCQAwAhoQICAJMDACGiAgIAkwMAIaMCIACZAwAhAwMAAPQDACAEAACOBgAgCQAAjwYAIA8DAACaAwAgBAAA0gMAIAkAANQDACD7AQAA4QMAMPwBAAADABD9AQAA4QMAMP4BAQAAAAGUAgEAkAMAIZwCAQCQAwAhnwJAAJEDACGgAgEAkAMAIaECAgCTAwAhogICAJMDACGjAiAAmQMAIdQCAADgAwAgAwAAAAMAIAEAAAQAMAIAAAUAIAcEAADSAwAgBgAA3wMAIPsBAADeAwAw_AEAAAcAEP0BAADeAwAwnAIBAJADACGyAgIAkwMAIQIEAACOBgAgBgAAkwYAIAgEAADSAwAgBgAA3wMAIPsBAADeAwAw_AEAAAcAEP0BAADeAwAwnAIBAJADACGyAgIAkwMAIdMCAADdAwAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACABAAAABwAgCQQAANIDACANAADEAwAg-wEAANwDADD8AQAADQAQ_QEAANwDADD-AQEAkAMAIZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIQIEAACOBgAgDQAAzAUAIAoEAADSAwAgDQAAxAMAIPsBAADcAwAw_AEAAA0AEP0BAADcAwAw_gEBAAAAAZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIdICAADbAwAgAwAAAA0AIAEAAA4AMAIAAA8AIBIEAADSAwAgCAAA2AMAIAoAANkDACALAADaAwAgDAAAxQMAIPsBAADXAwAw_AEAABEAEP0BAADXAwAw_gEBAJADACGaAkAAkQMAIZwCAQCQAwAhqgIBAL0DACGrAgIAkwMAIawCAQCQAwAhrQIBAJADACGuAgEAvQMAIa8CQACSAwAhsAICAL4DACEJBAAAjgYAIAgAAJAGACAKAACRBgAgCwAAkgYAIAwAAM0FACCqAgAA4gMAIK4CAADiAwAgrwIAAOIDACCwAgAA4gMAIBMEAADSAwAgCAAA2AMAIAoAANkDACALAADaAwAgDAAAxQMAIPsBAADXAwAw_AEAABEAEP0BAADXAwAw_gEBAAAAAZoCQACRAwAhnAIBAJADACGqAgEAvQMAIasCAgCTAwAhrAIBAJADACGtAgEAkAMAIa4CAQC9AwAhrwJAAJIDACGwAgIAvgMAIdECAADWAwAgAwAAABEAIAEAABIAMAIAABMAIAEAAAANACAJCQAA1AMAIPsBAADVAwAw_AEAABYAEP0BAADVAwAw_gEBAJADACGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQEJAACPBgAgCQkAANQDACD7AQAA1QMAMPwBAAAWABD9AQAA1QMAMP4BAQAAAAGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQMAAAAWACABAAAXADACAAAYACALCQAA1AMAIPsBAADTAwAw_AEAABoAEP0BAADTAwAw_gEBAJADACGaAkAAkQMAIaACAQCQAwAhpAIBAJADACGlAgEAkAMAIaYCAQC9AwAhpwIBAL0DACEDCQAAjwYAIKYCAADiAwAgpwIAAOIDACALCQAA1AMAIPsBAADTAwAw_AEAABoAEP0BAADTAwAw_gEBAAAAAZoCQACRAwAhoAIBAJADACGkAgEAkAMAIaUCAQCQAwAhpgIBAL0DACGnAgEAvQMAIQMAAAAaACABAAAbADACAAAcACADAAAAAwAgAQAABAAwAgAABQAgAQAAABYAIAEAAAAaACABAAAAAwAgAQAAABEAIAMAAAARACABAAASADACAAATACADAAAAAwAgAQAABAAwAgAABQAgCwMAAJoDACAEAADSAwAg-wEAANADADD8AQAAJQAQ_QEAANADADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGcAgEAkAMAIZ4CAADRA54CIp8CQACRAwAhAgMAAPQDACAEAACOBgAgDAMAAJoDACAEAADSAwAg-wEAANADADD8AQAAJQAQ_QEAANADADD-AQEAAAABlAIBAJADACGaAkAAkQMAIZwCAQCQAwAhngIAANEDngIinwJAAJEDACHQAgAAzwMAIAMAAAAlACABAAAmADACAAAnACABAAAABwAgAQAAAA0AIAEAAAARACABAAAAAwAgAQAAACUAIAMAAAAlACABAAAmADACAAAnACAIAwAAmgMAIPsBAADOAwAw_AEAAC8AEP0BAADOAwAw_gEBAJADACGUAgEAkAMAIZoCQACRAwAhmwIBAJADACEBAwAA9AMAIAkDAACaAwAg-wEAAM4DADD8AQAALwAQ_QEAAM4DADD-AQEAAAABlAIBAJADACGaAkAAkQMAIZsCAQCQAwAhzwIAAM0DACADAAAALwAgAQAAMAAwAgAAMQAgCQMAAJoDACD7AQAAzAMAMPwBAAAzABD9AQAAzAMAMP4BAQCQAwAhlAIBAJADACGYAgEAkAMAIZkCAQCQAwAhmgJAAJEDACEBAwAA9AMAIAkDAACaAwAg-wEAAMwDADD8AQAAMwAQ_QEAAMwDADD-AQEAAAABlAIBAJADACGYAgEAAAABmQIBAJADACGaAkAAkQMAIQMAAAAzACABAAA0ADACAAA1ACAIAwAAmgMAIPsBAACYAwAw_AEAADcAEP0BAACYAwAwlAIBAJADACGVAiAAmQMAIZYCIACZAwAhlwIgAJkDACEBAAAANwAgAQAAAAMAIAEAAAAlACABAAAALwAgAQAAADMAIAEAAAABACARDAAAxQMAIA8AAMYDACAQAADJAwAgEQAAygMAIBIAAMsDACD7AQAAyAMAMPwBAAA-ABD9AQAAyAMAMP4BAQCQAwAhmgJAAJEDACGfAkAAkQMAIckCAQCQAwAhygIBAL0DACHLAgEAvQMAIcwCAQC9AwAhzQIBAL0DACHOAiAAmQMAIQkMAADNBQAgDwAAzgUAIBAAAIsGACARAACMBgAgEgAAjQYAIMoCAADiAwAgywIAAOIDACDMAgAA4gMAIM0CAADiAwAgAwAAAD4AIAEAAD8AMAIAAAEAIAMAAAA-ACABAAA_ADACAAABACADAAAAPgAgAQAAPwAwAgAAAQAgDgwAAIYGACAPAACHBgAgEAAAiAYAIBEAAIkGACASAACKBgAg_gEBAAAAAZoCQAAAAAGfAkAAAAAByQIBAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAc0CAQAAAAHOAiAAAAABARgAAEMAIAn-AQEAAAABmgJAAAAAAZ8CQAAAAAHJAgEAAAABygIBAAAAAcsCAQAAAAHMAgEAAAABzQIBAAAAAc4CIAAAAAEBGAAARQAwARgAAEUAMA4MAADSBQAgDwAA0wUAIBAAANQFACARAADVBQAgEgAA1gUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIckCAQDoAwAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIBAJUEACHOAiAA8QMAIQIAAAABACAYAABIACAJ_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyQIBAOgDACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAgEAlQQAIc4CIADxAwAhAgAAAD4AIBgAAEoAIAIAAAA-ACAYAABKACADAAAAAQAgHwAAQwAgIAAASAAgAQAAAAEAIAEAAAA-ACAHBQAAzwUAICUAANEFACAmAADQBQAgygIAAOIDACDLAgAA4gMAIMwCAADiAwAgzQIAAOIDACAM-wEAAMcDADD8AQAAUQAQ_QEAAMcDADD-AQEAgAMAIZoCQACBAwAhnwJAAIEDACHJAgEAgAMAIcoCAQCjAwAhywIBAKMDACHMAgEAowMAIc0CAQCjAwAhzgIgAJUDACEDAAAAPgAgAQAAUAAwJAAAUQAgAwAAAD4AIAEAAD8AMAIAAAEAIB8HAACvAwAgCAAAvwPAAiMMAADFAwAgDQAAxAMAIA4AAMMDACAPAADGAwAg-wEAALwDADD8AQAAVwAQ_QEAALwDADD-AQEAAAABmgJAAJEDACGeAgAAwAPBAiKfAkAAkQMAIawCAQCQAwAhrQIBAJADACGwAgIAvgMAIbcCAQAAAAG4AgEAvQMAIbkCAQC9AwAhugIAAIQDACC7AgEAvQMAIbwCAQC9AwAhvQICAL4DACG-AgIAvgMAIcICAADBA8ICIsMCCADCAwAhxAICAJMDACHFAgIAvgMAIcYCAQC9AwAhxwJAAJIDACHIAkAAkgMAIQEAAABUACABAAAAVAAgHwcAAK8DACAIAAC_A8ACIwwAAMUDACANAADEAwAgDgAAwwMAIA8AAMYDACD7AQAAvAMAMPwBAABXABD9AQAAvAMAMP4BAQCQAwAhmgJAAJEDACGeAgAAwAPBAiKfAkAAkQMAIawCAQCQAwAhrQIBAJADACGwAgIAvgMAIbcCAQC9AwAhuAIBAL0DACG5AgEAvQMAIboCAACEAwAguwIBAL0DACG8AgEAvQMAIb0CAgC-AwAhvgICAL4DACHCAgAAwQPCAiLDAggAwgMAIcQCAgCTAwAhxQICAL4DACHGAgEAvQMAIccCQACSAwAhyAJAAJIDACETBwAAggUAIAgAAOIDACAMAADNBQAgDQAAzAUAIA4AAMsFACAPAADOBQAgsAIAAOIDACC3AgAA4gMAILgCAADiAwAguQIAAOIDACC7AgAA4gMAILwCAADiAwAgvQIAAOIDACC-AgAA4gMAIMMCAADiAwAgxQIAAOIDACDGAgAA4gMAIMcCAADiAwAgyAIAAOIDACADAAAAVwAgAQAAWAAwAgAAVAAgAwAAAFcAIAEAAFgAMAIAAFQAIAMAAABXACABAABYADACAABUACAcBwAAxgUAIAgAAADAAgMMAADJBQAgDQAAyAUAIA4AAMcFACAPAADKBQAg_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAAByAJAAAAAAQEYAABcACAXCAAAAMACA_4BAQAAAAGaAkAAAAABngIAAADBAgKfAkAAAAABrAIBAAAAAa0CAQAAAAGwAgIAAAABtwIBAAAAAbgCAQAAAAG5AgEAAAABugIAAMUFACC7AgEAAAABvAIBAAAAAb0CAgAAAAG-AgIAAAABwgIAAADCAgLDAggAAAABxAICAAAAAcUCAgAAAAHGAgEAAAABxwJAAAAAAcgCQAAAAAEBGAAAXgAwARgAAF4AMBwHAACNBQAgCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACHIAkAA6gMAIQIAAABUACAYAABhACAXCAAAiQXAAiP-AQEA6AMAIZoCQADpAwAhngIAAIoFwQIinwJAAOkDACGsAgEA6AMAIa0CAQDoAwAhsAICAKIEACG3AgEAlQQAIbgCAQCVBAAhuQIBAJUEACG6AgAAiAUAILsCAQCVBAAhvAIBAJUEACG9AgIAogQAIb4CAgCiBAAhwgIAAIsFwgIiwwIIAIwFACHEAgIA6wMAIcUCAgCiBAAhxgIBAJUEACHHAkAA6gMAIcgCQADqAwAhAgAAAFcAIBgAAGMAIAIAAABXACAYAABjACADAAAAVAAgHwAAXAAgIAAAYQAgAQAAAFQAIAEAAABXACATBQAAgwUAIAgAAOIDACAlAACGBQAgJgAAhQUAIDcAAIQFACA4AACHBQAgsAIAAOIDACC3AgAA4gMAILgCAADiAwAguQIAAOIDACC7AgAA4gMAILwCAADiAwAgvQIAAOIDACC-AgAA4gMAIMMCAADiAwAgxQIAAOIDACDGAgAA4gMAIMcCAADiAwAgyAIAAOIDACAaCAAAsQPAAiP7AQAAsAMAMPwBAABqABD9AQAAsAMAMP4BAQCAAwAhmgJAAIEDACGeAgAAsgPBAiKfAkAAgQMAIawCAQCAAwAhrQIBAIADACGwAgIAqAMAIbcCAQCjAwAhuAIBAKMDACG5AgEAowMAIboCAACEAwAguwIBAKMDACG8AgEAowMAIb0CAgCoAwAhvgICAKgDACHCAgAAswPCAiLDAggAtAMAIcQCAgCDAwAhxQICAKgDACHGAgEAowMAIccCQACCAwAhyAJAAIIDACEDAAAAVwAgAQAAaQAwJAAAagAgAwAAAFcAIAEAAFgAMAIAAFQAIAYEAACvAwAg-wEAAK4DADD8AQAAcAAQ_QEAAK4DADD-AQIAAAABswIBAAAAAQEAAABtACABAAAAbQAgBgQAAK8DACD7AQAArgMAMPwBAABwABD9AQAArgMAMP4BAgCTAwAhswIBAJADACEBBAAAggUAIAMAAABwACABAABxADACAABtACADAAAAcAAgAQAAcQAwAgAAbQAgAwAAAHAAIAEAAHEAMAIAAG0AIAMEAACBBQAg_gECAAAAAbMCAQAAAAEBGAAAdQAgAv4BAgAAAAGzAgEAAAABARgAAHcAMAEYAAB3ADADBAAA9AQAIP4BAgDrAwAhswIBAOgDACECAAAAbQAgGAAAegAgAv4BAgDrAwAhswIBAOgDACECAAAAcAAgGAAAfAAgAgAAAHAAIBgAAHwAIAMAAABtACAfAAB1ACAgAAB6ACABAAAAbQAgAQAAAHAAIAUFAADvBAAgJQAA8gQAICYAAPEEACA3AADwBAAgOAAA8wQAIAX7AQAArQMAMPwBAACDAQAQ_QEAAK0DADD-AQIAgwMAIbMCAQCAAwAhAwAAAHAAIAEAAIIBADAkAACDAQAgAwAAAHAAIAEAAHEAMAIAAG0AIAEAAAAJACABAAAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgBAQAAO0EACAGAADuBAAgnAIBAAAAAbICAgAAAAEBGAAAiwEAIAKcAgEAAAABsgICAAAAAQEYAACNAQAwARgAAI0BADAEBAAA6wQAIAYAAOwEACCcAgEA6AMAIbICAgDrAwAhAgAAAAkAIBgAAJABACACnAIBAOgDACGyAgIA6wMAIQIAAAAHACAYAACSAQAgAgAAAAcAIBgAAJIBACADAAAACQAgHwAAiwEAICAAAJABACABAAAACQAgAQAAAAcAIAUFAADmBAAgJQAA6QQAICYAAOgEACA3AADnBAAgOAAA6gQAIAX7AQAArAMAMPwBAACZAQAQ_QEAAKwDADCcAgEAgAMAIbICAgCDAwAhAwAAAAcAIAEAAJgBADAkAACZAQAgAwAAAAcAIAEAAAgAMAIAAAkAIAEAAAAPACABAAAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIAMAAAANACABAAAOADACAAAPACADAAAADQAgAQAADgAwAgAADwAgBgQAAOQEACANAADlBAAg_gEBAAAAAZwCAQAAAAGsAgEAAAABsQICAAAAAQEYAAChAQAgBP4BAQAAAAGcAgEAAAABrAIBAAAAAbECAgAAAAEBGAAAowEAMAEYAACjAQAwBgQAANYEACANAADXBAAg_gEBAOgDACGcAgEA6AMAIawCAQDoAwAhsQICAOsDACECAAAADwAgGAAApgEAIAT-AQEA6AMAIZwCAQDoAwAhrAIBAOgDACGxAgIA6wMAIQIAAAANACAYAACoAQAgAgAAAA0AIBgAAKgBACADAAAADwAgHwAAoQEAICAAAKYBACABAAAADwAgAQAAAA0AIAUFAADRBAAgJQAA1AQAICYAANMEACA3AADSBAAgOAAA1QQAIAf7AQAAqwMAMPwBAACvAQAQ_QEAAKsDADD-AQEAgAMAIZwCAQCAAwAhrAIBAIADACGxAgIAgwMAIQMAAAANACABAACuAQAwJAAArwEAIAMAAAANACABAAAOADACAAAPACABAAAAEwAgAQAAABMAIAMAAAARACABAAASADACAAATACADAAAAEQAgAQAAEgAwAgAAEwAgAwAAABEAIAEAABIAMAIAABMAIA8EAADMBAAgCAAAzQQAIAoAAM4EACALAADPBAAgDAAA0AQAIP4BAQAAAAGaAkAAAAABnAIBAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEBGAAAtwEAIAr-AQEAAAABmgJAAAAAAZwCAQAAAAGqAgEAAAABqwICAAAAAawCAQAAAAGtAgEAAAABrgIBAAAAAa8CQAAAAAGwAgIAAAABARgAALkBADABGAAAuQEAMAEAAAANACAPBAAAowQAIAgAAKQEACAKAAClBAAgCwAApgQAIAwAAKcEACD-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGqAgEAlQQAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQIAAAATACAYAAC9AQAgCv4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIaoCAQCVBAAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhAgAAABEAIBgAAL8BACACAAAAEQAgGAAAvwEAIAEAAAANACADAAAAEwAgHwAAtwEAICAAAL0BACABAAAAEwAgAQAAABEAIAkFAACdBAAgJQAAoAQAICYAAJ8EACA3AACeBAAgOAAAoQQAIKoCAADiAwAgrgIAAOIDACCvAgAA4gMAILACAADiAwAgDfsBAACnAwAw_AEAAMcBABD9AQAApwMAMP4BAQCAAwAhmgJAAIEDACGcAgEAgAMAIaoCAQCjAwAhqwICAIMDACGsAgEAgAMAIa0CAQCAAwAhrgIBAKMDACGvAkAAggMAIbACAgCoAwAhAwAAABEAIAEAAMYBADAkAADHAQAgAwAAABEAIAEAABIAMAIAABMAIAEAAAAYACABAAAAGAAgAwAAABYAIAEAABcAMAIAABgAIAMAAAAWACABAAAXADACAAAYACADAAAAFgAgAQAAFwAwAgAAGAAgBgkAAJwEACD-AQEAAAABoAIBAAAAAaQCAQAAAAGoAgEAAAABqQIBAAAAAQEYAADPAQAgBf4BAQAAAAGgAgEAAAABpAIBAAAAAagCAQAAAAGpAgEAAAABARgAANEBADABGAAA0QEAMAYJAACbBAAg_gEBAOgDACGgAgEA6AMAIaQCAQDoAwAhqAIBAOgDACGpAgEA6AMAIQIAAAAYACAYAADUAQAgBf4BAQDoAwAhoAIBAOgDACGkAgEA6AMAIagCAQDoAwAhqQIBAOgDACECAAAAFgAgGAAA1gEAIAIAAAAWACAYAADWAQAgAwAAABgAIB8AAM8BACAgAADUAQAgAQAAABgAIAEAAAAWACADBQAAmAQAICUAAJoEACAmAACZBAAgCPsBAACmAwAw_AEAAN0BABD9AQAApgMAMP4BAQCAAwAhoAIBAIADACGkAgEAgAMAIagCAQCAAwAhqQIBAIADACEDAAAAFgAgAQAA3AEAMCQAAN0BACADAAAAFgAgAQAAFwAwAgAAGAAgAQAAABwAIAEAAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAMAAAAaACABAAAbADACAAAcACAICQAAlwQAIP4BAQAAAAGaAkAAAAABoAIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAEBGAAA5QEAIAf-AQEAAAABmgJAAAAAAaACAQAAAAGkAgEAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABARgAAOcBADABGAAA5wEAMAgJAACWBAAg_gEBAOgDACGaAkAA6QMAIaACAQDoAwAhpAIBAOgDACGlAgEA6AMAIaYCAQCVBAAhpwIBAJUEACECAAAAHAAgGAAA6gEAIAf-AQEA6AMAIZoCQADpAwAhoAIBAOgDACGkAgEA6AMAIaUCAQDoAwAhpgIBAJUEACGnAgEAlQQAIQIAAAAaACAYAADsAQAgAgAAABoAIBgAAOwBACADAAAAHAAgHwAA5QEAICAAAOoBACABAAAAHAAgAQAAABoAIAUFAACSBAAgJQAAlAQAICYAAJMEACCmAgAA4gMAIKcCAADiAwAgCvsBAACiAwAw_AEAAPMBABD9AQAAogMAMP4BAQCAAwAhmgJAAIEDACGgAgEAgAMAIaQCAQCAAwAhpQIBAIADACGmAgEAowMAIacCAQCjAwAhAwAAABoAIAEAAPIBADAkAADzAQAgAwAAABoAIAEAABsAMAIAABwAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgCwMAAI8EACAEAACQBAAgCQAAkQQAIP4BAQAAAAGUAgEAAAABnAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABARgAAPsBACAI_gEBAAAAAZQCAQAAAAGcAgEAAAABnwJAAAAAAaACAQAAAAGhAgIAAAABogICAAAAAaMCIAAAAAEBGAAA_QEAMAEYAAD9AQAwCwMAAIwEACAEAACNBAAgCQAAjgQAIP4BAQDoAwAhlAIBAOgDACGcAgEA6AMAIZ8CQADpAwAhoAIBAOgDACGhAgIA6wMAIaICAgDrAwAhowIgAPEDACECAAAABQAgGAAAgAIAIAj-AQEA6AMAIZQCAQDoAwAhnAIBAOgDACGfAkAA6QMAIaACAQDoAwAhoQICAOsDACGiAgIA6wMAIaMCIADxAwAhAgAAAAMAIBgAAIICACACAAAAAwAgGAAAggIAIAMAAAAFACAfAAD7AQAgIAAAgAIAIAEAAAAFACABAAAAAwAgBQUAAIcEACAlAACKBAAgJgAAiQQAIDcAAIgEACA4AACLBAAgC_sBAAChAwAw_AEAAIkCABD9AQAAoQMAMP4BAQCAAwAhlAIBAIADACGcAgEAgAMAIZ8CQACBAwAhoAIBAIADACGhAgIAgwMAIaICAgCDAwAhowIgAJUDACEDAAAAAwAgAQAAiAIAMCQAAIkCACADAAAAAwAgAQAABAAwAgAABQAgAQAAACcAIAEAAAAnACADAAAAJQAgAQAAJgAwAgAAJwAgAwAAACUAIAEAACYAMAIAACcAIAMAAAAlACABAAAmADACAAAnACAIAwAAhQQAIAQAAIYEACD-AQEAAAABlAIBAAAAAZoCQAAAAAGcAgEAAAABngIAAACeAgKfAkAAAAABARgAAJECACAG_gEBAAAAAZQCAQAAAAGaAkAAAAABnAIBAAAAAZ4CAAAAngICnwJAAAAAAQEYAACTAgAwARgAAJMCADAIAwAAgwQAIAQAAIQEACD-AQEA6AMAIZQCAQDoAwAhmgJAAOkDACGcAgEA6AMAIZ4CAACCBJ4CIp8CQADpAwAhAgAAACcAIBgAAJYCACAG_gEBAOgDACGUAgEA6AMAIZoCQADpAwAhnAIBAOgDACGeAgAAggSeAiKfAkAA6QMAIQIAAAAlACAYAACYAgAgAgAAACUAIBgAAJgCACADAAAAJwAgHwAAkQIAICAAAJYCACABAAAAJwAgAQAAACUAIAMFAAD_AwAgJQAAgQQAICYAAIAEACAJ-wEAAJ0DADD8AQAAnwIAEP0BAACdAwAw_gEBAIADACGUAgEAgAMAIZoCQACBAwAhnAIBAIADACGeAgAAngOeAiKfAkAAgQMAIQMAAAAlACABAACeAgAwJAAAnwIAIAMAAAAlACABAAAmADACAAAnACABAAAAMQAgAQAAADEAIAMAAAAvACABAAAwADACAAAxACADAAAALwAgAQAAMAAwAgAAMQAgAwAAAC8AIAEAADAAMAIAADEAIAUDAAD-AwAg_gEBAAAAAZQCAQAAAAGaAkAAAAABmwIBAAAAAQEYAACnAgAgBP4BAQAAAAGUAgEAAAABmgJAAAAAAZsCAQAAAAEBGAAAqQIAMAEYAACpAgAwBQMAAP0DACD-AQEA6AMAIZQCAQDoAwAhmgJAAOkDACGbAgEA6AMAIQIAAAAxACAYAACsAgAgBP4BAQDoAwAhlAIBAOgDACGaAkAA6QMAIZsCAQDoAwAhAgAAAC8AIBgAAK4CACACAAAALwAgGAAArgIAIAMAAAAxACAfAACnAgAgIAAArAIAIAEAAAAxACABAAAALwAgAwUAAPoDACAlAAD8AwAgJgAA-wMAIAf7AQAAnAMAMPwBAAC1AgAQ_QEAAJwDADD-AQEAgAMAIZQCAQCAAwAhmgJAAIEDACGbAgEAgAMAIQMAAAAvACABAAC0AgAwJAAAtQIAIAMAAAAvACABAAAwADACAAAxACABAAAANQAgAQAAADUAIAMAAAAzACABAAA0ADACAAA1ACADAAAAMwAgAQAANAAwAgAANQAgAwAAADMAIAEAADQAMAIAADUAIAYDAAD5AwAg_gEBAAAAAZQCAQAAAAGYAgEAAAABmQIBAAAAAZoCQAAAAAEBGAAAvQIAIAX-AQEAAAABlAIBAAAAAZgCAQAAAAGZAgEAAAABmgJAAAAAAQEYAAC_AgAwARgAAL8CADAGAwAA-AMAIP4BAQDoAwAhlAIBAOgDACGYAgEA6AMAIZkCAQDoAwAhmgJAAOkDACECAAAANQAgGAAAwgIAIAX-AQEA6AMAIZQCAQDoAwAhmAIBAOgDACGZAgEA6AMAIZoCQADpAwAhAgAAADMAIBgAAMQCACACAAAAMwAgGAAAxAIAIAMAAAA1ACAfAAC9AgAgIAAAwgIAIAEAAAA1ACABAAAAMwAgAwUAAPUDACAlAAD3AwAgJgAA9gMAIAj7AQAAmwMAMPwBAADLAgAQ_QEAAJsDADD-AQEAgAMAIZQCAQCAAwAhmAIBAIADACGZAgEAgAMAIZoCQACBAwAhAwAAADMAIAEAAMoCADAkAADLAgAgAwAAADMAIAEAADQAMAIAADUAIAgDAACaAwAg-wEAAJgDADD8AQAANwAQ_QEAAJgDADCUAgEAAAABlQIgAJkDACGWAiAAmQMAIZcCIACZAwAhAQAAAM4CACABAAAAzgIAIAEDAAD0AwAgAwAAADcAIAEAANECADACAADOAgAgAwAAADcAIAEAANECADACAADOAgAgAwAAADcAIAEAANECADACAADOAgAgBQMAAPMDACCUAgEAAAABlQIgAAAAAZYCIAAAAAGXAiAAAAABARgAANUCACAElAIBAAAAAZUCIAAAAAGWAiAAAAABlwIgAAAAAQEYAADXAgAwARgAANcCADAFAwAA8gMAIJQCAQDoAwAhlQIgAPEDACGWAiAA8QMAIZcCIADxAwAhAgAAAM4CACAYAADaAgAgBJQCAQDoAwAhlQIgAPEDACGWAiAA8QMAIZcCIADxAwAhAgAAADcAIBgAANwCACACAAAANwAgGAAA3AIAIAMAAADOAgAgHwAA1QIAICAAANoCACABAAAAzgIAIAEAAAA3ACADBQAA7gMAICUAAPADACAmAADvAwAgB_sBAACUAwAw_AEAAOMCABD9AQAAlAMAMJQCAQCAAwAhlQIgAJUDACGWAiAAlQMAIZcCIACVAwAhAwAAADcAIAEAAOICADAkAADjAgAgAwAAADcAIAEAANECADACAADOAgAgC_sBAACPAwAw_AEAAOkCABD9AQAAjwMAMP4BAQAAAAH_AQEAkAMAIYACQACRAwAhgQJAAJIDACGCAgIAkwMAIYMCAgCTAwAhhAICAJMDACGFAgAAhAMAIAEAAADmAgAgAQAAAOYCACAL-wEAAI8DADD8AQAA6QIAEP0BAACPAwAw_gEBAJADACH_AQEAkAMAIYACQACRAwAhgQJAAJIDACGCAgIAkwMAIYMCAgCTAwAhhAICAJMDACGFAgAAhAMAIAGBAgAA4gMAIAMAAADpAgAgAQAA6gIAMAIAAOYCACADAAAA6QIAIAEAAOoCADACAADmAgAgAwAAAOkCACABAADqAgAwAgAA5gIAIAj-AQEAAAAB_wEBAAAAAYACQAAAAAGBAkAAAAABggICAAAAAYMCAgAAAAGEAgIAAAABhQIAAO0DACABGAAA7gIAIAj-AQEAAAAB_wEBAAAAAYACQAAAAAGBAkAAAAABggICAAAAAYMCAgAAAAGEAgIAAAABhQIAAO0DACABGAAA8AIAMAEYAADwAgAwCP4BAQDoAwAh_wEBAOgDACGAAkAA6QMAIYECQADqAwAhggICAOsDACGDAgIA6wMAIYQCAgDrAwAhhQIAAOwDACACAAAA5gIAIBgAAPMCACAI_gEBAOgDACH_AQEA6AMAIYACQADpAwAhgQJAAOoDACGCAgIA6wMAIYMCAgDrAwAhhAICAOsDACGFAgAA7AMAIAIAAADpAgAgGAAA9QIAIAIAAADpAgAgGAAA9QIAIAMAAADmAgAgHwAA7gIAICAAAPMCACABAAAA5gIAIAEAAADpAgAgBgUAAOMDACAlAADmAwAgJgAA5QMAIDcAAOQDACA4AADnAwAggQIAAOIDACAL-wEAAP8CADD8AQAA_AIAEP0BAAD_AgAw_gEBAIADACH_AQEAgAMAIYACQACBAwAhgQJAAIIDACGCAgIAgwMAIYMCAgCDAwAhhAICAIMDACGFAgAAhAMAIAMAAADpAgAgAQAA-wIAMCQAAPwCACADAAAA6QIAIAEAAOoCADACAADmAgAgC_sBAAD_AgAw_AEAAPwCABD9AQAA_wIAMP4BAQCAAwAh_wEBAIADACGAAkAAgQMAIYECQACCAwAhggICAIMDACGDAgIAgwMAIYQCAgCDAwAhhQIAAIQDACAOBQAAhgMAICUAAI4DACAmAACOAwAghgIBAAAAAYoCAQAAAASLAgEAAAAEjAIBAAAAAY0CAQAAAAGOAgEAAAABjwIBAAAAAZACAQCNAwAhkQIBAAAAAZICAQAAAAGTAgEAAAABCwUAAIYDACAlAACMAwAgJgAAjAMAIIYCQAAAAAGKAkAAAAAEiwJAAAAABIwCQAAAAAGNAkAAAAABjgJAAAAAAY8CQAAAAAGQAkAAiwMAIQsFAACJAwAgJQAAigMAICYAAIoDACCGAkAAAAABigJAAAAABYsCQAAAAAWMAkAAAAABjQJAAAAAAY4CQAAAAAGPAkAAAAABkAJAAIgDACENBQAAhgMAICUAAIYDACAmAACGAwAgNwAAhwMAIDgAAIYDACCGAgIAAAABigICAAAABIsCAgAAAASMAgIAAAABjQICAAAAAY4CAgAAAAGPAgIAAAABkAICAIUDACEEhgIBAAAABYcCAQAAAAGIAgEAAAAEiQIBAAAABA0FAACGAwAgJQAAhgMAICYAAIYDACA3AACHAwAgOAAAhgMAIIYCAgAAAAGKAgIAAAAEiwICAAAABIwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAhQMAIQiGAgIAAAABigICAAAABIsCAgAAAASMAgIAAAABjQICAAAAAY4CAgAAAAGPAgIAAAABkAICAIYDACEIhgIIAAAAAYoCCAAAAASLAggAAAAEjAIIAAAAAY0CCAAAAAGOAggAAAABjwIIAAAAAZACCACHAwAhCwUAAIkDACAlAACKAwAgJgAAigMAIIYCQAAAAAGKAkAAAAAFiwJAAAAABYwCQAAAAAGNAkAAAAABjgJAAAAAAY8CQAAAAAGQAkAAiAMAIQiGAgIAAAABigICAAAABYsCAgAAAAWMAgIAAAABjQICAAAAAY4CAgAAAAGPAgIAAAABkAICAIkDACEIhgJAAAAAAYoCQAAAAAWLAkAAAAAFjAJAAAAAAY0CQAAAAAGOAkAAAAABjwJAAAAAAZACQACKAwAhCwUAAIYDACAlAACMAwAgJgAAjAMAIIYCQAAAAAGKAkAAAAAEiwJAAAAABIwCQAAAAAGNAkAAAAABjgJAAAAAAY8CQAAAAAGQAkAAiwMAIQiGAkAAAAABigJAAAAABIsCQAAAAASMAkAAAAABjQJAAAAAAY4CQAAAAAGPAkAAAAABkAJAAIwDACEOBQAAhgMAICUAAI4DACAmAACOAwAghgIBAAAAAYoCAQAAAASLAgEAAAAEjAIBAAAAAY0CAQAAAAGOAgEAAAABjwIBAAAAAZACAQCNAwAhkQIBAAAAAZICAQAAAAGTAgEAAAABC4YCAQAAAAGKAgEAAAAEiwIBAAAABIwCAQAAAAGNAgEAAAABjgIBAAAAAY8CAQAAAAGQAgEAjgMAIZECAQAAAAGSAgEAAAABkwIBAAAAAQv7AQAAjwMAMPwBAADpAgAQ_QEAAI8DADD-AQEAkAMAIf8BAQCQAwAhgAJAAJEDACGBAkAAkgMAIYICAgCTAwAhgwICAJMDACGEAgIAkwMAIYUCAACEAwAgC4YCAQAAAAGKAgEAAAAEiwIBAAAABIwCAQAAAAGNAgEAAAABjgIBAAAAAY8CAQAAAAGQAgEAjgMAIZECAQAAAAGSAgEAAAABkwIBAAAAAQiGAkAAAAABigJAAAAABIsCQAAAAASMAkAAAAABjQJAAAAAAY4CQAAAAAGPAkAAAAABkAJAAIwDACEIhgJAAAAAAYoCQAAAAAWLAkAAAAAFjAJAAAAAAY0CQAAAAAGOAkAAAAABjwJAAAAAAZACQACKAwAhCIYCAgAAAAGKAgIAAAAEiwICAAAABIwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAhgMAIQf7AQAAlAMAMPwBAADjAgAQ_QEAAJQDADCUAgEAgAMAIZUCIACVAwAhlgIgAJUDACGXAiAAlQMAIQUFAACGAwAgJQAAlwMAICYAAJcDACCGAiAAAAABkAIgAJYDACEFBQAAhgMAICUAAJcDACAmAACXAwAghgIgAAAAAZACIACWAwAhAoYCIAAAAAGQAiAAlwMAIQgDAACaAwAg-wEAAJgDADD8AQAANwAQ_QEAAJgDADCUAgEAkAMAIZUCIACZAwAhlgIgAJkDACGXAiAAmQMAIQKGAiAAAAABkAIgAJcDACETDAAAxQMAIA8AAMYDACAQAADJAwAgEQAAygMAIBIAAMsDACD7AQAAyAMAMPwBAAA-ABD9AQAAyAMAMP4BAQCQAwAhmgJAAJEDACGfAkAAkQMAIckCAQCQAwAhygIBAL0DACHLAgEAvQMAIcwCAQC9AwAhzQIBAL0DACHOAiAAmQMAIdUCAAA-ACDWAgAAPgAgCPsBAACbAwAw_AEAAMsCABD9AQAAmwMAMP4BAQCAAwAhlAIBAIADACGYAgEAgAMAIZkCAQCAAwAhmgJAAIEDACEH-wEAAJwDADD8AQAAtQIAEP0BAACcAwAw_gEBAIADACGUAgEAgAMAIZoCQACBAwAhmwIBAIADACEJ-wEAAJ0DADD8AQAAnwIAEP0BAACdAwAw_gEBAIADACGUAgEAgAMAIZoCQACBAwAhnAIBAIADACGeAgAAngOeAiKfAkAAgQMAIQcFAACGAwAgJQAAoAMAICYAAKADACCGAgAAAJ4CAooCAAAAngIIiwIAAACeAgiQAgAAnwOeAiIHBQAAhgMAICUAAKADACAmAACgAwAghgIAAACeAgKKAgAAAJ4CCIsCAAAAngIIkAIAAJ8DngIiBIYCAAAAngICigIAAACeAgiLAgAAAJ4CCJACAACgA54CIgv7AQAAoQMAMPwBAACJAgAQ_QEAAKEDADD-AQEAgAMAIZQCAQCAAwAhnAIBAIADACGfAkAAgQMAIaACAQCAAwAhoQICAIMDACGiAgIAgwMAIaMCIACVAwAhCvsBAACiAwAw_AEAAPMBABD9AQAAogMAMP4BAQCAAwAhmgJAAIEDACGgAgEAgAMAIaQCAQCAAwAhpQIBAIADACGmAgEAowMAIacCAQCjAwAhDgUAAIkDACAlAAClAwAgJgAApQMAIIYCAQAAAAGKAgEAAAAFiwIBAAAABYwCAQAAAAGNAgEAAAABjgIBAAAAAY8CAQAAAAGQAgEApAMAIZECAQAAAAGSAgEAAAABkwIBAAAAAQ4FAACJAwAgJQAApQMAICYAAKUDACCGAgEAAAABigIBAAAABYsCAQAAAAWMAgEAAAABjQIBAAAAAY4CAQAAAAGPAgEAAAABkAIBAKQDACGRAgEAAAABkgIBAAAAAZMCAQAAAAELhgIBAAAAAYoCAQAAAAWLAgEAAAAFjAIBAAAAAY0CAQAAAAGOAgEAAAABjwIBAAAAAZACAQClAwAhkQIBAAAAAZICAQAAAAGTAgEAAAABCPsBAACmAwAw_AEAAN0BABD9AQAApgMAMP4BAQCAAwAhoAIBAIADACGkAgEAgAMAIagCAQCAAwAhqQIBAIADACEN-wEAAKcDADD8AQAAxwEAEP0BAACnAwAw_gEBAIADACGaAkAAgQMAIZwCAQCAAwAhqgIBAKMDACGrAgIAgwMAIawCAQCAAwAhrQIBAIADACGuAgEAowMAIa8CQACCAwAhsAICAKgDACENBQAAiQMAICUAAIkDACAmAACJAwAgNwAAqgMAIDgAAIkDACCGAgIAAAABigICAAAABYsCAgAAAAWMAgIAAAABjQICAAAAAY4CAgAAAAGPAgIAAAABkAICAKkDACENBQAAiQMAICUAAIkDACAmAACJAwAgNwAAqgMAIDgAAIkDACCGAgIAAAABigICAAAABYsCAgAAAAWMAgIAAAABjQICAAAAAY4CAgAAAAGPAgIAAAABkAICAKkDACEIhgIIAAAAAYoCCAAAAAWLAggAAAAFjAIIAAAAAY0CCAAAAAGOAggAAAABjwIIAAAAAZACCACqAwAhB_sBAACrAwAw_AEAAK8BABD9AQAAqwMAMP4BAQCAAwAhnAIBAIADACGsAgEAgAMAIbECAgCDAwAhBfsBAACsAwAw_AEAAJkBABD9AQAArAMAMJwCAQCAAwAhsgICAIMDACEF-wEAAK0DADD8AQAAgwEAEP0BAACtAwAw_gECAIMDACGzAgEAgAMAIQYEAACvAwAg-wEAAK4DADD8AQAAcAAQ_QEAAK4DADD-AQIAkwMAIbMCAQCQAwAhA7QCAAAHACC1AgAABwAgtgIAAAcAIBoIAACxA8ACI_sBAACwAwAw_AEAAGoAEP0BAACwAwAw_gEBAIADACGaAkAAgQMAIZ4CAACyA8ECIp8CQACBAwAhrAIBAIADACGtAgEAgAMAIbACAgCoAwAhtwIBAKMDACG4AgEAowMAIbkCAQCjAwAhugIAAIQDACC7AgEAowMAIbwCAQCjAwAhvQICAKgDACG-AgIAqAMAIcICAACzA8ICIsMCCAC0AwAhxAICAIMDACHFAgIAqAMAIcYCAQCjAwAhxwJAAIIDACHIAkAAggMAIQcFAACJAwAgJQAAuwMAICYAALsDACCGAgAAAMACA4oCAAAAwAIJiwIAAADAAgmQAgAAugPAAiMHBQAAhgMAICUAALkDACAmAAC5AwAghgIAAADBAgKKAgAAAMECCIsCAAAAwQIIkAIAALgDwQIiBwUAAIYDACAlAAC3AwAgJgAAtwMAIIYCAAAAwgICigIAAADCAgiLAgAAAMICCJACAAC2A8ICIg0FAACJAwAgJQAAqgMAICYAAKoDACA3AACqAwAgOAAAqgMAIIYCCAAAAAGKAggAAAAFiwIIAAAABYwCCAAAAAGNAggAAAABjgIIAAAAAY8CCAAAAAGQAggAtQMAIQ0FAACJAwAgJQAAqgMAICYAAKoDACA3AACqAwAgOAAAqgMAIIYCCAAAAAGKAggAAAAFiwIIAAAABYwCCAAAAAGNAggAAAABjgIIAAAAAY8CCAAAAAGQAggAtQMAIQcFAACGAwAgJQAAtwMAICYAALcDACCGAgAAAMICAooCAAAAwgIIiwIAAADCAgiQAgAAtgPCAiIEhgIAAADCAgKKAgAAAMICCIsCAAAAwgIIkAIAALcDwgIiBwUAAIYDACAlAAC5AwAgJgAAuQMAIIYCAAAAwQICigIAAADBAgiLAgAAAMECCJACAAC4A8ECIgSGAgAAAMECAooCAAAAwQIIiwIAAADBAgiQAgAAuQPBAiIHBQAAiQMAICUAALsDACAmAAC7AwAghgIAAADAAgOKAgAAAMACCYsCAAAAwAIJkAIAALoDwAIjBIYCAAAAwAIDigIAAADAAgmLAgAAAMACCZACAAC7A8ACIx8HAACvAwAgCAAAvwPAAiMMAADFAwAgDQAAxAMAIA4AAMMDACAPAADGAwAg-wEAALwDADD8AQAAVwAQ_QEAALwDADD-AQEAkAMAIZoCQACRAwAhngIAAMADwQIinwJAAJEDACGsAgEAkAMAIa0CAQCQAwAhsAICAL4DACG3AgEAvQMAIbgCAQC9AwAhuQIBAL0DACG6AgAAhAMAILsCAQC9AwAhvAIBAL0DACG9AgIAvgMAIb4CAgC-AwAhwgIAAMEDwgIiwwIIAMIDACHEAgIAkwMAIcUCAgC-AwAhxgIBAL0DACHHAkAAkgMAIcgCQACSAwAhC4YCAQAAAAGKAgEAAAAFiwIBAAAABYwCAQAAAAGNAgEAAAABjgIBAAAAAY8CAQAAAAGQAgEApQMAIZECAQAAAAGSAgEAAAABkwIBAAAAAQiGAgIAAAABigICAAAABYsCAgAAAAWMAgIAAAABjQICAAAAAY4CAgAAAAGPAgIAAAABkAICAIkDACEEhgIAAADAAgOKAgAAAMACCYsCAAAAwAIJkAIAALsDwAIjBIYCAAAAwQICigIAAADBAgiLAgAAAMECCJACAAC5A8ECIgSGAgAAAMICAooCAAAAwgIIiwIAAADCAgiQAgAAtwPCAiIIhgIIAAAAAYoCCAAAAAWLAggAAAAFjAIIAAAAAY0CCAAAAAGOAggAAAABjwIIAAAAAZACCACqAwAhA7QCAAANACC1AgAADQAgtgIAAA0AIAO0AgAAEQAgtQIAABEAILYCAAARACADtAIAAAMAILUCAAADACC2AgAAAwAgA7QCAAAlACC1AgAAJQAgtgIAACUAIAz7AQAAxwMAMPwBAABRABD9AQAAxwMAMP4BAQCAAwAhmgJAAIEDACGfAkAAgQMAIckCAQCAAwAhygIBAKMDACHLAgEAowMAIcwCAQCjAwAhzQIBAKMDACHOAiAAlQMAIREMAADFAwAgDwAAxgMAIBAAAMkDACARAADKAwAgEgAAywMAIPsBAADIAwAw_AEAAD4AEP0BAADIAwAw_gEBAJADACGaAkAAkQMAIZ8CQACRAwAhyQIBAJADACHKAgEAvQMAIcsCAQC9AwAhzAIBAL0DACHNAgEAvQMAIc4CIACZAwAhA7QCAAAvACC1AgAALwAgtgIAAC8AIAO0AgAAMwAgtQIAADMAILYCAAAzACAKAwAAmgMAIPsBAACYAwAw_AEAADcAEP0BAACYAwAwlAIBAJADACGVAiAAmQMAIZYCIACZAwAhlwIgAJkDACHVAgAANwAg1gIAADcAIAkDAACaAwAg-wEAAMwDADD8AQAAMwAQ_QEAAMwDADD-AQEAkAMAIZQCAQCQAwAhmAIBAJADACGZAgEAkAMAIZoCQACRAwAhApQCAQAAAAGbAgEAAAABCAMAAJoDACD7AQAAzgMAMPwBAAAvABD9AQAAzgMAMP4BAQCQAwAhlAIBAJADACGaAkAAkQMAIZsCAQCQAwAhApQCAQAAAAGcAgEAAAABCwMAAJoDACAEAADSAwAg-wEAANADADD8AQAAJQAQ_QEAANADADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGcAgEAkAMAIZ4CAADRA54CIp8CQACRAwAhBIYCAAAAngICigIAAACeAgiLAgAAAJ4CCJACAACgA54CIiEHAACvAwAgCAAAvwPAAiMMAADFAwAgDQAAxAMAIA4AAMMDACAPAADGAwAg-wEAALwDADD8AQAAVwAQ_QEAALwDADD-AQEAkAMAIZoCQACRAwAhngIAAMADwQIinwJAAJEDACGsAgEAkAMAIa0CAQCQAwAhsAICAL4DACG3AgEAvQMAIbgCAQC9AwAhuQIBAL0DACG6AgAAhAMAILsCAQC9AwAhvAIBAL0DACG9AgIAvgMAIb4CAgC-AwAhwgIAAMEDwgIiwwIIAMIDACHEAgIAkwMAIcUCAgC-AwAhxgIBAL0DACHHAkAAkgMAIcgCQACSAwAh1QIAAFcAINYCAABXACALCQAA1AMAIPsBAADTAwAw_AEAABoAEP0BAADTAwAw_gEBAJADACGaAkAAkQMAIaACAQCQAwAhpAIBAJADACGlAgEAkAMAIaYCAQC9AwAhpwIBAL0DACEUBAAA0gMAIAgAANgDACAKAADZAwAgCwAA2gMAIAwAAMUDACD7AQAA1wMAMPwBAAARABD9AQAA1wMAMP4BAQCQAwAhmgJAAJEDACGcAgEAkAMAIaoCAQC9AwAhqwICAJMDACGsAgEAkAMAIa0CAQCQAwAhrgIBAL0DACGvAkAAkgMAIbACAgC-AwAh1QIAABEAINYCAAARACAJCQAA1AMAIPsBAADVAwAw_AEAABYAEP0BAADVAwAw_gEBAJADACGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQOcAgEAAAABqgIBAAAAAasCAgAAAAESBAAA0gMAIAgAANgDACAKAADZAwAgCwAA2gMAIAwAAMUDACD7AQAA1wMAMPwBAAARABD9AQAA1wMAMP4BAQCQAwAhmgJAAJEDACGcAgEAkAMAIaoCAQC9AwAhqwICAJMDACGsAgEAkAMAIa0CAQCQAwAhrgIBAL0DACGvAkAAkgMAIbACAgC-AwAhCwQAANIDACANAADEAwAg-wEAANwDADD8AQAADQAQ_QEAANwDADD-AQEAkAMAIZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIdUCAAANACDWAgAADQAgA7QCAAAWACC1AgAAFgAgtgIAABYAIAO0AgAAGgAgtQIAABoAILYCAAAaACACnAIBAAAAAbECAgAAAAEJBAAA0gMAIA0AAMQDACD7AQAA3AMAMPwBAAANABD9AQAA3AMAMP4BAQCQAwAhnAIBAJADACGsAgEAkAMAIbECAgCTAwAhApwCAQAAAAGyAgIAAAABBwQAANIDACAGAADfAwAg-wEAAN4DADD8AQAABwAQ_QEAAN4DADCcAgEAkAMAIbICAgCTAwAhCAQAAK8DACD7AQAArgMAMPwBAABwABD9AQAArgMAMP4BAgCTAwAhswIBAJADACHVAgAAcAAg1gIAAHAAIAKUAgEAAAABoAIBAAAAAQ4DAACaAwAgBAAA0gMAIAkAANQDACD7AQAA4QMAMPwBAAADABD9AQAA4QMAMP4BAQCQAwAhlAIBAJADACGcAgEAkAMAIZ8CQACRAwAhoAIBAJADACGhAgIAkwMAIaICAgCTAwAhowIgAJkDACEAAAAAAAAB2gIBAAAAAQHaAkAAAAABAdoCQAAAAAEF2gICAAAAAeACAgAAAAHhAgIAAAAB4gICAAAAAeMCAgAAAAEC2gIBAAAABOQCAQAAAAUB2gIBAAAABAAAAAHaAiAAAAABBR8AAOgGACAgAADrBgAg1wIAAOkGACDYAgAA6gYAIN0CAAABACADHwAA6AYAINcCAADpBgAg3QIAAAEAIAkMAADNBQAgDwAAzgUAIBAAAIsGACARAACMBgAgEgAAjQYAIMoCAADiAwAgywIAAOIDACDMAgAA4gMAIM0CAADiAwAgAAAABR8AAOMGACAgAADmBgAg1wIAAOQGACDYAgAA5QYAIN0CAAABACADHwAA4wYAINcCAADkBgAg3QIAAAEAIAAAAAUfAADeBgAgIAAA4QYAINcCAADfBgAg2AIAAOAGACDdAgAAAQAgAx8AAN4GACDXAgAA3wYAIN0CAAABACAAAAAB2gIAAACeAgIFHwAA1gYAICAAANwGACDXAgAA1wYAINgCAADbBgAg3QIAAAEAIAUfAADUBgAgIAAA2QYAINcCAADVBgAg2AIAANgGACDdAgAAVAAgAx8AANYGACDXAgAA1wYAIN0CAAABACADHwAA1AYAINcCAADVBgAg3QIAAFQAIAAAAAAABR8AAMkGACAgAADSBgAg1wIAAMoGACDYAgAA0QYAIN0CAAABACAFHwAAxwYAICAAAM8GACDXAgAAyAYAINgCAADOBgAg3QIAAFQAIAUfAADFBgAgIAAAzAYAINcCAADGBgAg2AIAAMsGACDdAgAAEwAgAx8AAMkGACDXAgAAygYAIN0CAAABACADHwAAxwYAINcCAADIBgAg3QIAAFQAIAMfAADFBgAg1wIAAMYGACDdAgAAEwAgAAAAAdoCAQAAAAEFHwAAwAYAICAAAMMGACDXAgAAwQYAINgCAADCBgAg3QIAABMAIAMfAADABgAg1wIAAMEGACDdAgAAEwAgAAAABR8AALsGACAgAAC-BgAg1wIAALwGACDYAgAAvQYAIN0CAAATACADHwAAuwYAINcCAAC8BgAg3QIAABMAIAAAAAAABdoCAgAAAAHgAgIAAAAB4QICAAAAAeICAgAAAAHjAgIAAAABBR8AALAGACAgAAC5BgAg1wIAALEGACDYAgAAuAYAIN0CAABUACAHHwAArgYAICAAALYGACDXAgAArwYAINgCAAC1BgAg2wIAAA0AINwCAAANACDdAgAADwAgCx8AAMAEADAgAADFBAAw1wIAAMEEADDYAgAAwgQAMNkCAADDBAAg2gIAAMQEADDbAgAAxAQAMNwCAADEBAAw3QIAAMQEADDeAgAAxgQAMN8CAADHBAAwCx8AALQEADAgAAC5BAAw1wIAALUEADDYAgAAtgQAMNkCAAC3BAAg2gIAALgEADDbAgAAuAQAMNwCAAC4BAAw3QIAALgEADDeAgAAugQAMN8CAAC7BAAwCx8AAKgEADAgAACtBAAw1wIAAKkEADDYAgAAqgQAMNkCAACrBAAg2gIAAKwEADDbAgAArAQAMNwCAACsBAAw3QIAAKwEADDeAgAArgQAMN8CAACvBAAwCQMAAI8EACAEAACQBAAg_gEBAAAAAZQCAQAAAAGcAgEAAAABnwJAAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQIAAAAFACAfAACzBAAgAwAAAAUAIB8AALMEACAgAACyBAAgARgAALQGADAPAwAAmgMAIAQAANIDACAJAADUAwAg-wEAAOEDADD8AQAAAwAQ_QEAAOEDADD-AQEAAAABlAIBAJADACGcAgEAkAMAIZ8CQACRAwAhoAIBAJADACGhAgIAkwMAIaICAgCTAwAhowIgAJkDACHUAgAA4AMAIAIAAAAFACAYAACyBAAgAgAAALAEACAYAACxBAAgC_sBAACvBAAw_AEAALAEABD9AQAArwQAMP4BAQCQAwAhlAIBAJADACGcAgEAkAMAIZ8CQACRAwAhoAIBAJADACGhAgIAkwMAIaICAgCTAwAhowIgAJkDACEL-wEAAK8EADD8AQAAsAQAEP0BAACvBAAw_gEBAJADACGUAgEAkAMAIZwCAQCQAwAhnwJAAJEDACGgAgEAkAMAIaECAgCTAwAhogICAJMDACGjAiAAmQMAIQf-AQEA6AMAIZQCAQDoAwAhnAIBAOgDACGfAkAA6QMAIaECAgDrAwAhogICAOsDACGjAiAA8QMAIQkDAACMBAAgBAAAjQQAIP4BAQDoAwAhlAIBAOgDACGcAgEA6AMAIZ8CQADpAwAhoQICAOsDACGiAgIA6wMAIaMCIADxAwAhCQMAAI8EACAEAACQBAAg_gEBAAAAAZQCAQAAAAGcAgEAAAABnwJAAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQb-AQEAAAABmgJAAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAECAAAAHAAgHwAAvwQAIAMAAAAcACAfAAC_BAAgIAAAvgQAIAEYAACzBgAwCwkAANQDACD7AQAA0wMAMPwBAAAaABD9AQAA0wMAMP4BAQAAAAGaAkAAkQMAIaACAQCQAwAhpAIBAJADACGlAgEAkAMAIaYCAQC9AwAhpwIBAL0DACECAAAAHAAgGAAAvgQAIAIAAAC8BAAgGAAAvQQAIAr7AQAAuwQAMPwBAAC8BAAQ_QEAALsEADD-AQEAkAMAIZoCQACRAwAhoAIBAJADACGkAgEAkAMAIaUCAQCQAwAhpgIBAL0DACGnAgEAvQMAIQr7AQAAuwQAMPwBAAC8BAAQ_QEAALsEADD-AQEAkAMAIZoCQACRAwAhoAIBAJADACGkAgEAkAMAIaUCAQCQAwAhpgIBAL0DACGnAgEAvQMAIQb-AQEA6AMAIZoCQADpAwAhpAIBAOgDACGlAgEA6AMAIaYCAQCVBAAhpwIBAJUEACEG_gEBAOgDACGaAkAA6QMAIaQCAQDoAwAhpQIBAOgDACGmAgEAlQQAIacCAQCVBAAhBv4BAQAAAAGaAkAAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAQT-AQEAAAABpAIBAAAAAagCAQAAAAGpAgEAAAABAgAAABgAIB8AAMsEACADAAAAGAAgHwAAywQAICAAAMoEACABGAAAsgYAMAkJAADUAwAg-wEAANUDADD8AQAAFgAQ_QEAANUDADD-AQEAAAABoAIBAJADACGkAgEAkAMAIagCAQCQAwAhqQIBAJADACECAAAAGAAgGAAAygQAIAIAAADIBAAgGAAAyQQAIAj7AQAAxwQAMPwBAADIBAAQ_QEAAMcEADD-AQEAkAMAIaACAQCQAwAhpAIBAJADACGoAgEAkAMAIakCAQCQAwAhCPsBAADHBAAw_AEAAMgEABD9AQAAxwQAMP4BAQCQAwAhoAIBAJADACGkAgEAkAMAIagCAQCQAwAhqQIBAJADACEE_gEBAOgDACGkAgEA6AMAIagCAQDoAwAhqQIBAOgDACEE_gEBAOgDACGkAgEA6AMAIagCAQDoAwAhqQIBAOgDACEE_gEBAAAAAaQCAQAAAAGoAgEAAAABqQIBAAAAAQMfAACwBgAg1wIAALEGACDdAgAAVAAgAx8AAK4GACDXAgAArwYAIN0CAAAPACAEHwAAwAQAMNcCAADBBAAw2QIAAMMEACDdAgAAxAQAMAQfAAC0BAAw1wIAALUEADDZAgAAtwQAIN0CAAC4BAAwBB8AAKgEADDXAgAAqQQAMNkCAACrBAAg3QIAAKwEADAAAAAAAAUfAACoBgAgIAAArAYAINcCAACpBgAg2AIAAKsGACDdAgAAVAAgCx8AANgEADAgAADdBAAw1wIAANkEADDYAgAA2gQAMNkCAADbBAAg2gIAANwEADDbAgAA3AQAMNwCAADcBAAw3QIAANwEADDeAgAA3gQAMN8CAADfBAAwDQQAAMwEACAKAADOBAAgCwAAzwQAIAwAANAEACD-AQEAAAABmgJAAAAAAZwCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAECAAAAEwAgHwAA4wQAIAMAAAATACAfAADjBAAgIAAA4gQAIAEYAACqBgAwEwQAANIDACAIAADYAwAgCgAA2QMAIAsAANoDACAMAADFAwAg-wEAANcDADD8AQAAEQAQ_QEAANcDADD-AQEAAAABmgJAAJEDACGcAgEAkAMAIaoCAQC9AwAhqwICAJMDACGsAgEAkAMAIa0CAQCQAwAhrgIBAL0DACGvAkAAkgMAIbACAgC-AwAh0QIAANYDACACAAAAEwAgGAAA4gQAIAIAAADgBAAgGAAA4QQAIA37AQAA3wQAMPwBAADgBAAQ_QEAAN8EADD-AQEAkAMAIZoCQACRAwAhnAIBAJADACGqAgEAvQMAIasCAgCTAwAhrAIBAJADACGtAgEAkAMAIa4CAQC9AwAhrwJAAJIDACGwAgIAvgMAIQ37AQAA3wQAMPwBAADgBAAQ_QEAAN8EADD-AQEAkAMAIZoCQACRAwAhnAIBAJADACGqAgEAvQMAIasCAgCTAwAhrAIBAJADACGtAgEAkAMAIa4CAQC9AwAhrwJAAJIDACGwAgIAvgMAIQn-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACENBAAAowQAIAoAAKUEACALAACmBAAgDAAApwQAIP4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQ0EAADMBAAgCgAAzgQAIAsAAM8EACAMAADQBAAg_gEBAAAAAZoCQAAAAAGcAgEAAAABqwICAAAAAawCAQAAAAGtAgEAAAABrgIBAAAAAa8CQAAAAAGwAgIAAAABAx8AAKgGACDXAgAAqQYAIN0CAABUACAEHwAA2AQAMNcCAADZBAAw2QIAANsEACDdAgAA3AQAMAAAAAAABR8AAKAGACAgAACmBgAg1wIAAKEGACDYAgAApQYAIN0CAABUACAFHwAAngYAICAAAKMGACDXAgAAnwYAINgCAACiBgAg3QIAAG0AIAMfAACgBgAg1wIAAKEGACDdAgAAVAAgAx8AAJ4GACDXAgAAnwYAIN0CAABtACAAAAAAAAsfAAD1BAAwIAAA-gQAMNcCAAD2BAAw2AIAAPcEADDZAgAA-AQAINoCAAD5BAAw2wIAAPkEADDcAgAA-QQAMN0CAAD5BAAw3gIAAPsEADDfAgAA_AQAMAIEAADtBAAgnAIBAAAAAQIAAAAJACAfAACABQAgAwAAAAkAIB8AAIAFACAgAAD_BAAgARgAAJ0GADAIBAAA0gMAIAYAAN8DACD7AQAA3gMAMPwBAAAHABD9AQAA3gMAMJwCAQCQAwAhsgICAJMDACHTAgAA3QMAIAIAAAAJACAYAAD_BAAgAgAAAP0EACAYAAD-BAAgBfsBAAD8BAAw_AEAAP0EABD9AQAA_AQAMJwCAQCQAwAhsgICAJMDACEF-wEAAPwEADD8AQAA_QQAEP0BAAD8BAAwnAIBAJADACGyAgIAkwMAIQGcAgEA6AMAIQIEAADrBAAgnAIBAOgDACECBAAA7QQAIJwCAQAAAAEEHwAA9QQAMNcCAAD2BAAw2QIAAPgEACDdAgAA-QQAMAAAAAAAAALaAgEAAAAE5AIBAAAABQHaAgAAAMACAwHaAgAAAMECAgHaAgAAAMICAgXaAggAAAAB4AIIAAAAAeECCAAAAAHiAggAAAAB4wIIAAAAAQsfAAC8BQAwIAAAwAUAMNcCAAC9BQAw2AIAAL4FADDZAgAAvwUAINoCAAD5BAAw2wIAAPkEADDcAgAA-QQAMN0CAAD5BAAw3gIAAMEFADDfAgAA_AQAMAsfAACwBQAwIAAAtQUAMNcCAACxBQAw2AIAALIFADDZAgAAswUAINoCAAC0BQAw2wIAALQFADDcAgAAtAUAMN0CAAC0BQAw3gIAALYFADDfAgAAtwUAMAsfAACnBQAwIAAAqwUAMNcCAACoBQAw2AIAAKkFADDZAgAAqgUAINoCAADcBAAw2wIAANwEADDcAgAA3AQAMN0CAADcBAAw3gIAAKwFADDfAgAA3wQAMAsfAACeBQAwIAAAogUAMNcCAACfBQAw2AIAAKAFADDZAgAAoQUAINoCAACsBAAw2wIAAKwEADDcAgAArAQAMN0CAACsBAAw3gIAAKMFADDfAgAArwQAMAsfAACSBQAwIAAAlwUAMNcCAACTBQAw2AIAAJQFADDZAgAAlQUAINoCAACWBQAw2wIAAJYFADDcAgAAlgUAMN0CAACWBQAw3gIAAJgFADDfAgAAmQUAMAYDAACFBAAg_gEBAAAAAZQCAQAAAAGaAkAAAAABngIAAACeAgKfAkAAAAABAgAAACcAIB8AAJ0FACADAAAAJwAgHwAAnQUAICAAAJwFACABGAAAnAYAMAwDAACaAwAgBAAA0gMAIPsBAADQAwAw_AEAACUAEP0BAADQAwAw_gEBAAAAAZQCAQCQAwAhmgJAAJEDACGcAgEAkAMAIZ4CAADRA54CIp8CQACRAwAh0AIAAM8DACACAAAAJwAgGAAAnAUAIAIAAACaBQAgGAAAmwUAIAn7AQAAmQUAMPwBAACaBQAQ_QEAAJkFADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGcAgEAkAMAIZ4CAADRA54CIp8CQACRAwAhCfsBAACZBQAw_AEAAJoFABD9AQAAmQUAMP4BAQCQAwAhlAIBAJADACGaAkAAkQMAIZwCAQCQAwAhngIAANEDngIinwJAAJEDACEF_gEBAOgDACGUAgEA6AMAIZoCQADpAwAhngIAAIIEngIinwJAAOkDACEGAwAAgwQAIP4BAQDoAwAhlAIBAOgDACGaAkAA6QMAIZ4CAACCBJ4CIp8CQADpAwAhBgMAAIUEACD-AQEAAAABlAIBAAAAAZoCQAAAAAGeAgAAAJ4CAp8CQAAAAAEJAwAAjwQAIAkAAJEEACD-AQEAAAABlAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABAgAAAAUAIB8AAKYFACADAAAABQAgHwAApgUAICAAAKUFACABGAAAmwYAMAIAAAAFACAYAAClBQAgAgAAALAEACAYAACkBQAgB_4BAQDoAwAhlAIBAOgDACGfAkAA6QMAIaACAQDoAwAhoQICAOsDACGiAgIA6wMAIaMCIADxAwAhCQMAAIwEACAJAACOBAAg_gEBAOgDACGUAgEA6AMAIZ8CQADpAwAhoAIBAOgDACGhAgIA6wMAIaICAgDrAwAhowIgAPEDACEJAwAAjwQAIAkAAJEEACD-AQEAAAABlAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABDQgAAM0EACAKAADOBAAgCwAAzwQAIAwAANAEACD-AQEAAAABmgJAAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAECAAAAEwAgHwAArwUAIAMAAAATACAfAACvBQAgIAAArgUAIAEYAACaBgAwAgAAABMAIBgAAK4FACACAAAA4AQAIBgAAK0FACAJ_gEBAOgDACGaAkAA6QMAIaoCAQCVBAAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhDQgAAKQEACAKAAClBAAgCwAApgQAIAwAAKcEACD-AQEA6AMAIZoCQADpAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACENCAAAzQQAIAoAAM4EACALAADPBAAgDAAA0AQAIP4BAQAAAAGaAkAAAAABqgIBAAAAAasCAgAAAAGsAgEAAAABrQIBAAAAAa4CAQAAAAGvAkAAAAABsAICAAAAAQQNAADlBAAg_gEBAAAAAawCAQAAAAGxAgIAAAABAgAAAA8AIB8AALsFACADAAAADwAgHwAAuwUAICAAALoFACABGAAAmQYAMAoEAADSAwAgDQAAxAMAIPsBAADcAwAw_AEAAA0AEP0BAADcAwAw_gEBAAAAAZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIdICAADbAwAgAgAAAA8AIBgAALoFACACAAAAuAUAIBgAALkFACAH-wEAALcFADD8AQAAuAUAEP0BAAC3BQAw_gEBAJADACGcAgEAkAMAIawCAQCQAwAhsQICAJMDACEH-wEAALcFADD8AQAAuAUAEP0BAAC3BQAw_gEBAJADACGcAgEAkAMAIawCAQCQAwAhsQICAJMDACED_gEBAOgDACGsAgEA6AMAIbECAgDrAwAhBA0AANcEACD-AQEA6AMAIawCAQDoAwAhsQICAOsDACEEDQAA5QQAIP4BAQAAAAGsAgEAAAABsQICAAAAAQIGAADuBAAgsgICAAAAAQIAAAAJACAfAADEBQAgAwAAAAkAIB8AAMQFACAgAADDBQAgARgAAJgGADACAAAACQAgGAAAwwUAIAIAAAD9BAAgGAAAwgUAIAGyAgIA6wMAIQIGAADsBAAgsgICAOsDACECBgAA7gQAILICAgAAAAEB2gIBAAAABAQfAAC8BQAw1wIAAL0FADDZAgAAvwUAIN0CAAD5BAAwBB8AALAFADDXAgAAsQUAMNkCAACzBQAg3QIAALQFADAEHwAApwUAMNcCAACoBQAw2QIAAKoFACDdAgAA3AQAMAQfAACeBQAw1wIAAJ8FADDZAgAAoQUAIN0CAACsBAAwBB8AAJIFADDXAgAAkwUAMNkCAACVBQAg3QIAAJYFADAAAAAAAAAACx8AAP0FADAgAACBBgAw1wIAAP4FADDYAgAA_wUAMNkCAACABgAg2gIAAKwEADDbAgAArAQAMNwCAACsBAAw3QIAAKwEADDeAgAAggYAMN8CAACvBAAwCx8AAPQFADAgAAD4BQAw1wIAAPUFADDYAgAA9gUAMNkCAAD3BQAg2gIAAJYFADDbAgAAlgUAMNwCAACWBQAw3QIAAJYFADDeAgAA-QUAMN8CAACZBQAwCx8AAOgFADAgAADtBQAw1wIAAOkFADDYAgAA6gUAMNkCAADrBQAg2gIAAOwFADDbAgAA7AUAMNwCAADsBQAw3QIAAOwFADDeAgAA7gUAMN8CAADvBQAwCx8AANwFADAgAADhBQAw1wIAAN0FADDYAgAA3gUAMNkCAADfBQAg2gIAAOAFADDbAgAA4AUAMNwCAADgBQAw3QIAAOAFADDeAgAA4gUAMN8CAADjBQAwBx8AANcFACAgAADaBQAg1wIAANgFACDYAgAA2QUAINsCAAA3ACDcAgAANwAg3QIAAM4CACADlQIgAAAAAZYCIAAAAAGXAiAAAAABAgAAAM4CACAfAADXBQAgAwAAADcAIB8AANcFACAgAADbBQAgBQAAADcAIBgAANsFACCVAiAA8QMAIZYCIADxAwAhlwIgAPEDACEDlQIgAPEDACGWAiAA8QMAIZcCIADxAwAhBP4BAQAAAAGYAgEAAAABmQIBAAAAAZoCQAAAAAECAAAANQAgHwAA5wUAIAMAAAA1ACAfAADnBQAgIAAA5gUAIAEYAACXBgAwCQMAAJoDACD7AQAAzAMAMPwBAAAzABD9AQAAzAMAMP4BAQAAAAGUAgEAkAMAIZgCAQAAAAGZAgEAkAMAIZoCQACRAwAhAgAAADUAIBgAAOYFACACAAAA5AUAIBgAAOUFACAI-wEAAOMFADD8AQAA5AUAEP0BAADjBQAw_gEBAJADACGUAgEAkAMAIZgCAQCQAwAhmQIBAJADACGaAkAAkQMAIQj7AQAA4wUAMPwBAADkBQAQ_QEAAOMFADD-AQEAkAMAIZQCAQCQAwAhmAIBAJADACGZAgEAkAMAIZoCQACRAwAhBP4BAQDoAwAhmAIBAOgDACGZAgEA6AMAIZoCQADpAwAhBP4BAQDoAwAhmAIBAOgDACGZAgEA6AMAIZoCQADpAwAhBP4BAQAAAAGYAgEAAAABmQIBAAAAAZoCQAAAAAED_gEBAAAAAZoCQAAAAAGbAgEAAAABAgAAADEAIB8AAPMFACADAAAAMQAgHwAA8wUAICAAAPIFACABGAAAlgYAMAkDAACaAwAg-wEAAM4DADD8AQAALwAQ_QEAAM4DADD-AQEAAAABlAIBAJADACGaAkAAkQMAIZsCAQCQAwAhzwIAAM0DACACAAAAMQAgGAAA8gUAIAIAAADwBQAgGAAA8QUAIAf7AQAA7wUAMPwBAADwBQAQ_QEAAO8FADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGbAgEAkAMAIQf7AQAA7wUAMPwBAADwBQAQ_QEAAO8FADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGbAgEAkAMAIQP-AQEA6AMAIZoCQADpAwAhmwIBAOgDACED_gEBAOgDACGaAkAA6QMAIZsCAQDoAwAhA_4BAQAAAAGaAkAAAAABmwIBAAAAAQYEAACGBAAg_gEBAAAAAZoCQAAAAAGcAgEAAAABngIAAACeAgKfAkAAAAABAgAAACcAIB8AAPwFACADAAAAJwAgHwAA_AUAICAAAPsFACABGAAAlQYAMAIAAAAnACAYAAD7BQAgAgAAAJoFACAYAAD6BQAgBf4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIZ4CAACCBJ4CIp8CQADpAwAhBgQAAIQEACD-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGeAgAAggSeAiKfAkAA6QMAIQYEAACGBAAg_gEBAAAAAZoCQAAAAAGcAgEAAAABngIAAACeAgKfAkAAAAABCQQAAJAEACAJAACRBAAg_gEBAAAAAZwCAQAAAAGfAkAAAAABoAIBAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQIAAAAFACAfAACFBgAgAwAAAAUAIB8AAIUGACAgAACEBgAgARgAAJQGADACAAAABQAgGAAAhAYAIAIAAACwBAAgGAAAgwYAIAf-AQEA6AMAIZwCAQDoAwAhnwJAAOkDACGgAgEA6AMAIaECAgDrAwAhogICAOsDACGjAiAA8QMAIQkEAACNBAAgCQAAjgQAIP4BAQDoAwAhnAIBAOgDACGfAkAA6QMAIaACAQDoAwAhoQICAOsDACGiAgIA6wMAIaMCIADxAwAhCQQAAJAEACAJAACRBAAg_gEBAAAAAZwCAQAAAAGfAkAAAAABoAIBAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQQfAAD9BQAw1wIAAP4FADDZAgAAgAYAIN0CAACsBAAwBB8AAPQFADDXAgAA9QUAMNkCAAD3BQAg3QIAAJYFADAEHwAA6AUAMNcCAADpBQAw2QIAAOsFACDdAgAA7AUAMAQfAADcBQAw1wIAAN0FADDZAgAA3wUAIN0CAADgBQAwAx8AANcFACDXAgAA2AUAIN0CAADOAgAgAAABAwAA9AMAIBMHAACCBQAgCAAA4gMAIAwAAM0FACANAADMBQAgDgAAywUAIA8AAM4FACCwAgAA4gMAILcCAADiAwAguAIAAOIDACC5AgAA4gMAILsCAADiAwAgvAIAAOIDACC9AgAA4gMAIL4CAADiAwAgwwIAAOIDACDFAgAA4gMAIMYCAADiAwAgxwIAAOIDACDIAgAA4gMAIAkEAACOBgAgCAAAkAYAIAoAAJEGACALAACSBgAgDAAAzQUAIKoCAADiAwAgrgIAAOIDACCvAgAA4gMAILACAADiAwAgAgQAAI4GACANAADMBQAgAAABBAAAggUAIAf-AQEAAAABnAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABBf4BAQAAAAGaAkAAAAABnAIBAAAAAZ4CAAAAngICnwJAAAAAAQP-AQEAAAABmgJAAAAAAZsCAQAAAAEE_gEBAAAAAZgCAQAAAAGZAgEAAAABmgJAAAAAAQGyAgIAAAABA_4BAQAAAAGsAgEAAAABsQICAAAAAQn-AQEAAAABmgJAAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEH_gEBAAAAAZQCAQAAAAGfAkAAAAABoAIBAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQX-AQEAAAABlAIBAAAAAZoCQAAAAAGeAgAAAJ4CAp8CQAAAAAEBnAIBAAAAAQL-AQIAAAABswIBAAAAAQIAAABtACAfAACeBgAgGwgAAADAAgMMAADJBQAgDQAAyAUAIA4AAMcFACAPAADKBQAg_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAAByAJAAAAAAQIAAABUACAfAACgBgAgAwAAAHAAIB8AAJ4GACAgAACkBgAgBAAAAHAAIBgAAKQGACD-AQIA6wMAIbMCAQDoAwAhAv4BAgDrAwAhswIBAOgDACEDAAAAVwAgHwAAoAYAICAAAKcGACAdAAAAVwAgCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACAPAACRBQAgGAAApwYAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhyAJAAOoDACEbCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACHIAkAA6gMAIRsHAADGBQAgCAAAAMACAwwAAMkFACANAADIBQAgDwAAygUAIP4BAQAAAAGaAkAAAAABngIAAADBAgKfAkAAAAABrAIBAAAAAa0CAQAAAAGwAgIAAAABtwIBAAAAAbgCAQAAAAG5AgEAAAABugIAAMUFACC7AgEAAAABvAIBAAAAAb0CAgAAAAG-AgIAAAABwgIAAADCAgLDAggAAAABxAICAAAAAcUCAgAAAAHGAgEAAAABxwJAAAAAAcgCQAAAAAECAAAAVAAgHwAAqAYAIAn-AQEAAAABmgJAAAAAAZwCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEDAAAAVwAgHwAAqAYAICAAAK0GACAdAAAAVwAgBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA0AAI8FACAPAACRBQAgGAAArQYAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhyAJAAOoDACEbBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA0AAI8FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACHIAkAA6gMAIQUEAADkBAAg_gEBAAAAAZwCAQAAAAGsAgEAAAABsQICAAAAAQIAAAAPACAfAACuBgAgGwcAAMYFACAIAAAAwAIDDAAAyQUAIA4AAMcFACAPAADKBQAg_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAAByAJAAAAAAQIAAABUACAfAACwBgAgBP4BAQAAAAGkAgEAAAABqAIBAAAAAakCAQAAAAEG_gEBAAAAAZoCQAAAAAGkAgEAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABB_4BAQAAAAGUAgEAAAABnAIBAAAAAZ8CQAAAAAGhAgIAAAABogICAAAAAaMCIAAAAAEDAAAADQAgHwAArgYAICAAALcGACAHAAAADQAgBAAA1gQAIBgAALcGACD-AQEA6AMAIZwCAQDoAwAhrAIBAOgDACGxAgIA6wMAIQUEAADWBAAg_gEBAOgDACGcAgEA6AMAIawCAQDoAwAhsQICAOsDACEDAAAAVwAgHwAAsAYAICAAALoGACAdAAAAVwAgBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA4AAI4FACAPAACRBQAgGAAAugYAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhyAJAAOoDACEbBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA4AAI4FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACHIAkAA6gMAIQ4EAADMBAAgCAAAzQQAIAsAAM8EACAMAADQBAAg_gEBAAAAAZoCQAAAAAGcAgEAAAABqgIBAAAAAasCAgAAAAGsAgEAAAABrQIBAAAAAa4CAQAAAAGvAkAAAAABsAICAAAAAQIAAAATACAfAAC7BgAgAwAAABEAIB8AALsGACAgAAC_BgAgEAAAABEAIAQAAKMEACAIAACkBAAgCwAApgQAIAwAAKcEACAYAAC_BgAg_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACEOBAAAowQAIAgAAKQEACALAACmBAAgDAAApwQAIP4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIaoCAQCVBAAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhDgQAAMwEACAIAADNBAAgCgAAzgQAIAwAANAEACD-AQEAAAABmgJAAAAAAZwCAQAAAAGqAgEAAAABqwICAAAAAawCAQAAAAGtAgEAAAABrgIBAAAAAa8CQAAAAAGwAgIAAAABAgAAABMAIB8AAMAGACADAAAAEQAgHwAAwAYAICAAAMQGACAQAAAAEQAgBAAAowQAIAgAAKQEACAKAAClBAAgDAAApwQAIBgAAMQGACD-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGqAgEAlQQAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQ4EAACjBAAgCAAApAQAIAoAAKUEACAMAACnBAAg_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACEOBAAAzAQAIAgAAM0EACAKAADOBAAgCwAAzwQAIP4BAQAAAAGaAkAAAAABnAIBAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAECAAAAEwAgHwAAxQYAIBsHAADGBQAgCAAAAMACAw0AAMgFACAOAADHBQAgDwAAygUAIP4BAQAAAAGaAkAAAAABngIAAADBAgKfAkAAAAABrAIBAAAAAa0CAQAAAAGwAgIAAAABtwIBAAAAAbgCAQAAAAG5AgEAAAABugIAAMUFACC7AgEAAAABvAIBAAAAAb0CAgAAAAG-AgIAAAABwgIAAADCAgLDAggAAAABxAICAAAAAcUCAgAAAAHGAgEAAAABxwJAAAAAAcgCQAAAAAECAAAAVAAgHwAAxwYAIA0PAACHBgAgEAAAiAYAIBEAAIkGACASAACKBgAg_gEBAAAAAZoCQAAAAAGfAkAAAAAByQIBAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAc0CAQAAAAHOAiAAAAABAgAAAAEAIB8AAMkGACADAAAAEQAgHwAAxQYAICAAAM0GACAQAAAAEQAgBAAAowQAIAgAAKQEACAKAAClBAAgCwAApgQAIBgAAM0GACD-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGqAgEAlQQAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQ4EAACjBAAgCAAApAQAIAoAAKUEACALAACmBAAg_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACEDAAAAVwAgHwAAxwYAICAAANAGACAdAAAAVwAgBwAAjQUAIAgAAIkFwAIjDQAAjwUAIA4AAI4FACAPAACRBQAgGAAA0AYAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhyAJAAOoDACEbBwAAjQUAIAgAAIkFwAIjDQAAjwUAIA4AAI4FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACHIAkAA6gMAIQMAAAA-ACAfAADJBgAgIAAA0wYAIA8AAAA-ACAPAADTBQAgEAAA1AUAIBEAANUFACASAADWBQAgGAAA0wYAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIckCAQDoAwAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIBAJUEACHOAiAA8QMAIQ0PAADTBQAgEAAA1AUAIBEAANUFACASAADWBQAg_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyQIBAOgDACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAgEAlQQAIc4CIADxAwAhGwcAAMYFACAIAAAAwAIDDAAAyQUAIA0AAMgFACAOAADHBQAg_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAAByAJAAAAAAQIAAABUACAfAADUBgAgDQwAAIYGACAQAACIBgAgEQAAiQYAIBIAAIoGACD-AQEAAAABmgJAAAAAAZ8CQAAAAAHJAgEAAAABygIBAAAAAcsCAQAAAAHMAgEAAAABzQIBAAAAAc4CIAAAAAECAAAAAQAgHwAA1gYAIAMAAABXACAfAADUBgAgIAAA2gYAIB0AAABXACAHAACNBQAgCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACAYAADaBgAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACHIAkAA6gMAIRsHAACNBQAgCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACD-AQEA6AMAIZoCQADpAwAhngIAAIoFwQIinwJAAOkDACGsAgEA6AMAIa0CAQDoAwAhsAICAKIEACG3AgEAlQQAIbgCAQCVBAAhuQIBAJUEACG6AgAAiAUAILsCAQCVBAAhvAIBAJUEACG9AgIAogQAIb4CAgCiBAAhwgIAAIsFwgIiwwIIAIwFACHEAgIA6wMAIcUCAgCiBAAhxgIBAJUEACHHAkAA6gMAIcgCQADqAwAhAwAAAD4AIB8AANYGACAgAADdBgAgDwAAAD4AIAwAANIFACAQAADUBQAgEQAA1QUAIBIAANYFACAYAADdBgAg_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyQIBAOgDACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAgEAlQQAIc4CIADxAwAhDQwAANIFACAQAADUBQAgEQAA1QUAIBIAANYFACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHJAgEA6AMAIcoCAQCVBAAhywIBAJUEACHMAgEAlQQAIc0CAQCVBAAhzgIgAPEDACENDAAAhgYAIA8AAIcGACARAACJBgAgEgAAigYAIP4BAQAAAAGaAkAAAAABnwJAAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAgEAAAABzgIgAAAAAQIAAAABACAfAADeBgAgAwAAAD4AIB8AAN4GACAgAADiBgAgDwAAAD4AIAwAANIFACAPAADTBQAgEQAA1QUAIBIAANYFACAYAADiBgAg_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyQIBAOgDACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAgEAlQQAIc4CIADxAwAhDQwAANIFACAPAADTBQAgEQAA1QUAIBIAANYFACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHJAgEA6AMAIcoCAQCVBAAhywIBAJUEACHMAgEAlQQAIc0CAQCVBAAhzgIgAPEDACENDAAAhgYAIA8AAIcGACAQAACIBgAgEgAAigYAIP4BAQAAAAGaAkAAAAABnwJAAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAgEAAAABzgIgAAAAAQIAAAABACAfAADjBgAgAwAAAD4AIB8AAOMGACAgAADnBgAgDwAAAD4AIAwAANIFACAPAADTBQAgEAAA1AUAIBIAANYFACAYAADnBgAg_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyQIBAOgDACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAgEAlQQAIc4CIADxAwAhDQwAANIFACAPAADTBQAgEAAA1AUAIBIAANYFACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHJAgEA6AMAIcoCAQCVBAAhywIBAJUEACHMAgEAlQQAIc0CAQCVBAAhzgIgAPEDACENDAAAhgYAIA8AAIcGACAQAACIBgAgEQAAiQYAIP4BAQAAAAGaAkAAAAABnwJAAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAgEAAAABzgIgAAAAAQIAAAABACAfAADoBgAgAwAAAD4AIB8AAOgGACAgAADsBgAgDwAAAD4AIAwAANIFACAPAADTBQAgEAAA1AUAIBEAANUFACAYAADsBgAg_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyQIBAOgDACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAgEAlQQAIc4CIADxAwAhDQwAANIFACAPAADTBQAgEAAA1AUAIBEAANUFACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHJAgEA6AMAIcoCAQCVBAAhywIBAJUEACHMAgEAlQQAIc0CAQCVBAAhzgIgAPEDACEGBQASDAYCDy4NEDIPETYQEjgRAwMAAQQAAwkACAYFAA4HCgQMJAINIwgOEAcPKA0CBAADBgAFAgQLBAUABgEEDAADBAADBQAMDRQIBgQAAwUACwgVBwoZCQsdCgweAgEJAAgBCQAIAwofAAsgAAwhAAENIgACAwABBAADBQcpAAwsAA0rAA4qAA8tAAEDAAEBAwABAQMAAQQMOQAPOgAQOwARPAAAAAADBQAXJQAYJgAZAAAAAwUAFyUAGCYAGQAABQUAHiUAISYAIjcAHzgAIAAAAAAABQUAHiUAISYAIjcAHzgAIAAABQUAJyUAKiYAKzcAKDgAKQAAAAAABQUAJyUAKiYAKzcAKDgAKQIEAAMGAAUCBAADBgAFBQUAMCUAMyYANDcAMTgAMgAAAAAABQUAMCUAMyYANDcAMTgAMgEEAAMBBAADBQUAOSUAPCYAPTcAOjgAOwAAAAAABQUAOSUAPCYAPTcAOjgAOwIEAAMIvAEHAgQAAwjCAQcFBQBCJQBFJgBGNwBDOABEAAAAAAAFBQBCJQBFJgBGNwBDOABEAQkACAEJAAgDBQBLJQBMJgBNAAAAAwUASyUATCYATQEJAAgBCQAIAwUAUiUAUyYAVAAAAAMFAFIlAFMmAFQDAwABBAADCQAIAwMAAQQAAwkACAUFAFklAFwmAF03AFo4AFsAAAAAAAUFAFklAFwmAF03AFo4AFsCAwABBAADAgMAAQQAAwMFAGIlAGMmAGQAAAADBQBiJQBjJgBkAQMAAQEDAAEDBQBpJQBqJgBrAAAAAwUAaSUAaiYAawEDAAEBAwABAwUAcCUAcSYAcgAAAAMFAHAlAHEmAHIBAwABAQMAAQMFAHclAHgmAHkAAAADBQB3JQB4JgB5AAAABQUAfyUAggEmAIMBNwCAATgAgQEAAAAAAAUFAH8lAIIBJgCDATcAgAE4AIEBEwIBFD0BFUABFkEBF0IBGUQBGkYTG0cUHEkBHUsTHkwVIU0BIk4BI08TJ1IWKFMaKVUDKlYDK1kDLFoDLVsDLl0DL18TMGAbMWIDMmQTM2UcNGYDNWcDNmgTOWsdOmwjO24FPG8FPXIFPnMFP3QFQHYFQXgTQnkkQ3sFRH0TRX4lRn8FR4ABBUiBARNJhAEmSoUBLEuGAQRMhwEETYgBBE6JAQRPigEEUIwBBFGOARNSjwEtU5EBBFSTARNVlAEuVpUBBFeWAQRYlwETWZoBL1qbATVbnAEHXJ0BB12eAQdenwEHX6ABB2CiAQdhpAETYqUBNmOnAQdkqQETZaoBN2arAQdnrAEHaK0BE2mwAThqsQE-a7IBCGyzAQhttAEIbrUBCG-2AQhwuAEIcboBE3K7AT9zvgEIdMABE3XBAUB2wwEId8QBCHjFARN5yAFBeskBR3vKAQl8ywEJfcwBCX7NAQl_zgEJgAHQAQmBAdIBE4IB0wFIgwHVAQmEAdcBE4UB2AFJhgHZAQmHAdoBCYgB2wETiQHeAUqKAd8BTosB4AEKjAHhAQqNAeIBCo4B4wEKjwHkAQqQAeYBCpEB6AETkgHpAU-TAesBCpQB7QETlQHuAVCWAe8BCpcB8AEKmAHxAROZAfQBUZoB9QFVmwH2AQKcAfcBAp0B-AECngH5AQKfAfoBAqAB_AECoQH-AROiAf8BVqMBgQICpAGDAhOlAYQCV6YBhQICpwGGAgKoAYcCE6kBigJYqgGLAl6rAYwCDawBjQINrQGOAg2uAY8CDa8BkAINsAGSAg2xAZQCE7IBlQJfswGXAg20AZkCE7UBmgJgtgGbAg23AZwCDbgBnQITuQGgAmG6AaECZbsBogIPvAGjAg-9AaQCD74BpQIPvwGmAg_AAagCD8EBqgITwgGrAmbDAa0CD8QBrwITxQGwAmfGAbECD8cBsgIPyAGzAhPJAbYCaMoBtwJsywG4AhDMAbkCEM0BugIQzgG7AhDPAbwCENABvgIQ0QHAAhPSAcECbdMBwwIQ1AHFAhPVAcYCbtYBxwIQ1wHIAhDYAckCE9kBzAJv2gHNAnPbAc8CEdwB0AIR3QHSAhHeAdMCEd8B1AIR4AHWAhHhAdgCE-IB2QJ04wHbAhHkAd0CE-UB3gJ15gHfAhHnAeACEegB4QIT6QHkAnbqAeUCeusB5wJ77AHoAnvtAesCe-4B7AJ77wHtAnvwAe8Ce_EB8QIT8gHyAnzzAfQCe_QB9gIT9QH3An32AfgCe_cB-QJ7-AH6AhP5Af0CfvoB_gKEAQ"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("node:buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/env.ts
import { config as config2 } from "dotenv";
config2({ path: [".env.local", ".env"], quiet: true });
function str(name, fallback = "") {
  return process.env[name]?.trim() || fallback;
}
var env = {
  port: Number(str("PORT", "4000")),
  apiUrl: str("API_URL", "http://localhost:4000").replace(/\/$/, ""),
  databaseUrl: str("DATABASE_URL"),
  databaseSsl: str("DATABASE_SSL") === "true",
  adminToken: str("ADMIN_TOKEN"),
  metadataProvider: str("METADATA_PROVIDER", "mock"),
  metadataApiUrl: str("METADATA_API_URL"),
  metadataApiKey: str("METADATA_API_KEY"),
  videoProvider: str("VIDEO_PROVIDER", "mock"),
  videoProviderUrl: str("VIDEO_PROVIDER_URL"),
  videoProviderApiKey: str("VIDEO_PROVIDER_API_KEY"),
  youtubeApiKey: str("YOUTUBE_API_KEY"),
  youtubeChannels: str("YOUTUBE_CHANNELS").split(",").map((s) => s.trim()).filter(Boolean),
  cronSecret: str("CRON_SECRET"),
  syncCron: str("SYNC_CRON", "0 */6 * * *")
};

// src/lib/db.ts
var globalForPrisma = globalThis;
var db = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({
    // Strip sslmode so pg doesn't override our explicit ssl option below.
    connectionString: env.databaseUrl.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
    // Serverless: one connection per instance; the Supabase pooler multiplexes them.
    ...process.env.VERCEL ? { max: 1 } : {},
    ...env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}
  })
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// src/lib/http.ts
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
var HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
  status;
};
function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return r.data;
}
var idParam = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
var hashToken = (t) => createHash("sha256").update(t).digest("hex");
var newToken = () => randomBytes(32).toString("base64url");
async function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  if (token && token.length < 200) {
    const user2 = await db.user.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true } });
    if (user2) req.userId = user2.id;
  }
  next();
}
function requireAuth(req, _res, next) {
  if (!req.userId) throw new HttpError(401, "Authentication required");
  next();
}
function requireAdmin(req, _res, next) {
  const given = req.headers["x-admin-token"];
  if (!env.adminToken || typeof given !== "string") throw new HttpError(403, "Forbidden");
  const a = Buffer.from(given);
  const b = Buffer.from(env.adminToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(403, "Forbidden");
  next();
}
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
}

// src/providers/mock/catalog.ts
var ROWS = [
  ["starlit-blade", "Starlit Blade Chronicles", "\u661F\u5203\u5E74\u4EE3\u8A18", ["Action", "Fantasy", "Adventure"], "Studio K\u014Dmei", "TV", "AIRING", 8.7, -5, 12],
  ["neon-ronin", "Neon Ronin", "\u30CD\u30AA\u30F3\u6D6A\u4EBA", ["Action", "Sci-Fi", "Thriller"], "Orbit Works", "TV", "AIRING", 8.4, -3, 13],
  ["moonlit-cafe", "The Moonlit Caf\xE9", "\u6708\u591C\u306E\u55AB\u8336\u5E97", ["Slice of Life", "Romance", "Comedy"], "Pale Fox", "TV", "AIRING", 8.1, -6, 12],
  ["aether-academy", "Aether Academy", "\u30A8\u30FC\u30C6\u30EB\u5B66\u5712", ["Fantasy", "Adventure", "Comedy"], "Studio K\u014Dmei", "TV", "AIRING", 7.9, -2, 24],
  ["crimson-tide", "Crimson Tide Requiem", "\u7D05\u6F6E\u30EC\u30AF\u30A4\u30A8\u30E0", ["Horror", "Mystery", "Supernatural"], "Nightbloom", "TV", "AIRING", 8.8, -4, 12],
  ["mecha-vanguard", "Vanguard Zero", "\u30F4\u30A1\u30F3\u30AC\u30FC\u30C9\u30FB\u30BC\u30ED", ["Action", "Sci-Fi", "Drama"], "Orbit Works", "TV", "AIRING", 8, -1, 12],
  ["pitch-perfect", "Last Inning Dreams", "\u4E5D\u56DE\u88CF\u306E\u5922", ["Sports", "Drama"], "Redline", "TV", "AIRING", 8.3, -7, 25],
  ["cloud-courier", "Cloud Courier Mei", "\u96F2\u306E\u914D\u9054\u4EBA\u30E1\u30A4", ["Adventure", "Slice of Life", "Fantasy"], "Pale Fox", "TV", "AIRING", 8.5, -4, 12],
  ["shadow-archive", "Shadow Archive", "\u5F71\u306E\u6587\u66F8\u9928", ["Mystery", "Thriller", "Supernatural"], "Nightbloom", "TV", "AIRING", 8.2, -2, 12],
  ["ocean-hymn", "Hymn of the Deep", "\u6DF1\u6D77\u306E\u8B83\u6B4C", ["Fantasy", "Drama", "Romance"], "Studio K\u014Dmei", "TV", "AIRING", 8.6, -8, 13],
  ["iron-saints", "Iron Saints", "\u92FC\u306E\u8056\u8005\u305F\u3061", ["Action", "Drama", "Supernatural"], "Redline", "TV", "FINISHED", 8.9, -40, 24],
  ["paper-lanterns", "Paper Lantern Summer", "\u63D0\u706F\u306E\u590F", ["Romance", "Slice of Life", "Drama"], "Pale Fox", "TV", "FINISHED", 8.6, -45, 12],
  ["void-walker", "Void Walker", "\u865A\u7A7A\u306E\u65C5\u4EBA", ["Sci-Fi", "Adventure", "Mystery"], "Orbit Works", "TV", "FINISHED", 8.3, -60, 26],
  ["kitsune-court", "Kitsune Court", "\u72D0\u306E\u5BAE\u5EF7", ["Fantasy", "Romance", "Supernatural"], "Studio K\u014Dmei", "TV", "FINISHED", 8.1, -52, 24],
  ["gridiron-blaze", "Gridiron Blaze", "\u30B0\u30EA\u30C3\u30C9\u30A2\u30A4\u30A2\u30F3", ["Sports", "Comedy"], "Redline", "TV", "FINISHED", 7.7, -70, 25],
  ["haunted-lens", "The Haunted Lens", "\u6191\u304B\u308C\u305F\u30EC\u30F3\u30BA", ["Horror", "Thriller"], "Nightbloom", "OVA", "FINISHED", 7.5, -30, 4],
  ["dragon-postal", "Dragon Postal Service", "\u7ADC\u306E\u90F5\u4FBF\u5C40", ["Comedy", "Fantasy", "Adventure"], "Pale Fox", "TV", "FINISHED", 8, -80, 12],
  ["glass-horizon", "Glass Horizon", "\u785D\u5B50\u306E\u5730\u5E73", ["Sci-Fi", "Romance", "Drama"], "Orbit Works", "MOVIE", "FINISHED", 9, -100, 1],
  ["midnight-ramen", "Midnight Ramen Stories", "\u6DF1\u591C\u30E9\u30FC\u30E1\u30F3\u7269\u8A9E", ["Slice of Life", "Comedy"], "Pale Fox", "ONA", "FINISHED", 7.8, -35, 10],
  ["spirit-detective", "Spirit Detective Ayame", "\u970A\u63A2\u5075\u30A2\u30E4\u30E1", ["Mystery", "Supernatural", "Comedy"], "Nightbloom", "TV", "FINISHED", 8.2, -90, 24],
  ["tempest-knights", "Tempest Knights", "\u5D50\u306E\u9A0E\u58EB\u56E3", ["Action", "Fantasy", "Adventure"], "Redline", "TV", "FINISHED", 8.4, -120, 26],
  ["echo-colony", "Echo Colony", "\u30A8\u30B3\u30FC\u30FB\u30B3\u30ED\u30CB\u30FC", ["Sci-Fi", "Thriller", "Drama"], "Orbit Works", "TV", "FINISHED", 8.5, -110, 13],
  ["sakura-circuit", "Sakura Circuit", "\u685C\u30B5\u30FC\u30AD\u30C3\u30C8", ["Sports", "Romance"], "Redline", "TV", "FINISHED", 7.6, -65, 12],
  ["bone-orchard", "Bone Orchard", "\u9AA8\u306E\u679C\u6A39\u5712", ["Horror", "Fantasy", "Mystery"], "Nightbloom", "TV", "FINISHED", 8, -75, 12],
  ["lantern-sea", "Lantern Sea Special", "\u30E9\u30F3\u30BF\u30F3\u306E\u6D77", ["Fantasy", "Slice of Life"], "Pale Fox", "SPECIAL", "FINISHED", 7.4, -25, 1],
  ["cosmic-bakery", "Cosmic Bakery", "\u5B87\u5B99\u30D1\u30F3\u5DE5\u623F", ["Comedy", "Sci-Fi", "Slice of Life"], "Pale Fox", "TV", "FINISHED", 7.9, -55, 12],
  ["silver-wolf", "Silver Wolf Oath", "\u9280\u72FC\u306E\u8A93\u3044", ["Action", "Fantasy", "Drama"], "Studio K\u014Dmei", "MOVIE", "FINISHED", 8.7, -48, 1],
  ["azure-protocol", "Azure Protocol", "\u30A2\u30BA\u30FC\u30EB\u30FB\u30D7\u30ED\u30C8\u30B3\u30EB", ["Sci-Fi", "Action", "Mystery"], "Orbit Works", "TV", "FINISHED", 8.1, -85, 12],
  ["thunder-strings", "Thunder Strings", "\u96F7\u306E\u5F26", ["Drama", "Slice of Life", "Romance"], "Redline", "TV", "FINISHED", 8.3, -95, 13],
  ["abyss-rangers", "Abyss Rangers", "\u6DF1\u6DF5\u30EC\u30F3\u30B8\u30E3\u30FC\u30BA", ["Action", "Horror", "Sci-Fi"], "Nightbloom", "TV", "CANCELLED", 6.9, -38, 6],
  ["bamboo-chronicle", "Bamboo Chronicle", "\u7AF9\u53D6\u6F14\u7FA9", ["Fantasy", "Drama", "Adventure"], "Studio K\u014Dmei", "TV", "FINISHED", 8.2, -130, 26],
  ["crown-of-embers", "Crown of Embers", "\u71FC\u306E\u738B\u51A0", ["Action", "Fantasy", "Thriller"], "Redline", "TV", "UPCOMING", 0, 3, 12],
  ["velvet-orbit", "Velvet Orbit", "\u30D9\u30EB\u30D9\u30C3\u30C8\u30FB\u30AA\u30FC\u30D3\u30C3\u30C8", ["Sci-Fi", "Romance"], "Orbit Works", "TV", "UPCOMING", 0, 5, 12],
  ["ghost-train", "Midnight Ghost Train", "\u771F\u591C\u4E2D\u306E\u5E7D\u970A\u5217\u8ECA", ["Horror", "Mystery", "Supernatural"], "Nightbloom", "TV", "UPCOMING", 0, 2, 12],
  ["tea-and-thunder", "Tea & Thunder", "\u304A\u8336\u3068\u96F7", ["Comedy", "Slice of Life", "Fantasy"], "Pale Fox", "TV", "UPCOMING", 0, 8, 12],
  ["rival-stars", "Rival Stars Academy", "\u30E9\u30A4\u30D0\u30EB\u30B9\u30BF\u30FC\u30BA", ["Sports", "Drama", "Comedy"], "Redline", "TV", "UPCOMING", 0, 10, 24],
  ["wraith-signal", "Wraith Signal", "\u4EA1\u970A\u306E\u4FE1\u53F7", ["Thriller", "Sci-Fi", "Horror"], "Orbit Works", "ONA", "AIRING", 7.8, -1, 8],
  ["petal-storm", "Petal Storm Girls", "\u82B1\u5D50\u5C11\u5973", ["Action", "Romance", "Comedy"], "Pale Fox", "TV", "FINISHED", 7.5, -42, 12],
  ["clockwork-sky", "Clockwork Sky", "\u6B6F\u8ECA\u306E\u7A7A", ["Adventure", "Sci-Fi", "Fantasy"], "Studio K\u014Dmei", "TV", "FINISHED", 8.4, -140, 24]
];
var WEEK = 7 * 24 * 3600 * 1e3;
var DESCRIPTIONS = [
  "When an ancient rift tears open above a quiet town, an unlikely group must decide what they are willing to give up to seal it.",
  "Every night the city changes. Only a handful of people remember the version of the world that came before.",
  "A reluctant hero, a talkative companion and a map that rewrites itself. The journey is stranger than the destination.",
  "Small moments, big feelings: a season in the lives of people who never quite say what they mean.",
  "Rivals become allies when the final tournament reveals a secret the whole league has been hiding."
];
function seasonOf(date) {
  const m = date.getUTCMonth();
  return m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
}
function buildCatalog(now = /* @__PURE__ */ new Date()) {
  return ROWS.map((r, i) => {
    const [slug, english, native, genres, studio, type, status, rating, startWeeks, episodes] = r;
    const start = new Date(now.getTime() + startWeeks * WEEK);
    start.setUTCHours(15, 0, 0, 0);
    return {
      externalId: slug,
      title: english,
      englishTitle: english,
      nativeTitle: native,
      synonyms: [slug.replace(/-/g, " "), english.split(" ").slice(0, 2).join(" ")],
      description: DESCRIPTIONS[i % DESCRIPTIONS.length],
      coverImage: `https://picsum.photos/seed/${slug}-p/400/600`,
      bannerImage: `https://picsum.photos/seed/${slug}-b/1280/720`,
      year: start.getUTCFullYear(),
      month: start.getUTCMonth() + 1,
      season: seasonOf(start),
      status,
      type,
      rating: rating > 0 ? rating : null,
      popularity: Math.round((ROWS.length - i) / ROWS.length * 1e5) + i * 7919 % 500,
      duration: type === "MOVIE" ? 110 : type === "TV" ? 24 : 12,
      episodeCount: episodes,
      studio,
      startDate: start,
      genres
    };
  });
}
function buildEpisodes(anime) {
  const total = anime.episodeCount ?? 12;
  const start = anime.startDate ?? /* @__PURE__ */ new Date();
  const split = total > 13 ? Math.ceil(total / 2) : total;
  return Array.from({ length: total }, (_, n) => {
    const number = n + 1;
    const seasonNumber = number > split ? 2 : 1;
    const local = seasonNumber === 2 ? number - split : number;
    return {
      seasonNumber,
      episodeNumber: local,
      title: anime.type === "MOVIE" ? anime.title : `Episode ${local}: ${EP_TITLES[n % EP_TITLES.length]}`,
      description: `${anime.title}, episode ${local}. ${DESCRIPTIONS[(n + 1) % DESCRIPTIONS.length]}`,
      thumbnail: `https://picsum.photos/seed/${anime.externalId}-e${number}/480/270`,
      releaseDate: new Date(start.getTime() + n * WEEK),
      duration: anime.duration ?? 24
    };
  });
}
var EP_TITLES = [
  "The Door at Dusk",
  "A Name Left Behind",
  "Static",
  "What the River Knew",
  "Borrowed Light",
  "The Long Way Round",
  "Ash and Honey",
  "Paper Wings",
  "No Return Address",
  "Hollow Bells",
  "The Quiet Before",
  "Starfall",
  "Second Chances",
  "Crossed Wires",
  "The Weight of Rain"
];

// src/providers/mock/mockProviders.ts
var MockMetadataProvider = class {
  name = "mock";
  catalog = () => buildCatalog();
  async search(query) {
    const q = query.toLowerCase();
    return this.catalog().filter(
      (a) => [a.title, a.nativeTitle ?? "", ...a.synonyms].some((t) => t.toLowerCase().includes(q))
    );
  }
  async getAnime(id) {
    return this.catalog().find((a) => a.externalId === id) ?? null;
  }
  async getEpisodes(id) {
    const a = await this.getAnime(id);
    return a ? buildEpisodes(a) : [];
  }
  async getSeasons(id) {
    const eps = await this.getEpisodes(id);
    const nums = [...new Set(eps.map((e) => e.seasonNumber))];
    return nums.map((n) => ({ number: n, title: `Season ${n}` }));
  }
  async getSeasonAnime(year, season) {
    return this.catalog().filter((a) => a.year === year && a.season === season.toUpperCase());
  }
  async listAnime(page) {
    const all = this.catalog();
    const size = 20;
    return { items: all.slice((page - 1) * size, page * size), hasMore: page * size < all.length };
  }
};
var DEFAULT_SAMPLES = [
  // Blender Foundation "Big Buck Bunny" (open movie, CC-BY) hosted on archive.org
  "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4"
];
var configured = (process.env.MOCK_VIDEO_URLS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
var SAMPLES = configured.length ? configured : DEFAULT_SAMPLES;
function hash(s) {
  let h = 0;
  for (const c of s) h = h * 31 + c.charCodeAt(0) | 0;
  return Math.abs(h);
}
var MockVideoProvider = class {
  name = "mock";
  async getVideo(animeId, episodeId) {
    const url = SAMPLES[hash(animeId + episodeId) % SAMPLES.length];
    return {
      url,
      mimeType: "video/mp4",
      qualities: [{ label: "Auto", url }],
      introStart: 5,
      introEnd: 35
    };
  }
};
var MockSubtitleProvider = class {
  name = "mock";
  async getSubtitles(episodeId) {
    return [
      { language: "en", label: "English", url: `${env.apiUrl}/api/subtitles/mock/${episodeId}/en.vtt` },
      { language: "ja", label: "Japanese", url: `${env.apiUrl}/api/subtitles/mock/${episodeId}/ja.vtt` }
    ];
  }
};
function mockVtt(lang) {
  const lines = lang === "en" ? ["Previously, on the show\u2026", "This is a sample English subtitle.", "Subtitles are standard WebVTT.", "Pick another language in the player menu."] : ["\u524D\u56DE\u306E\u3042\u3089\u3059\u3058\u2026", "\u3053\u308C\u306F\u65E5\u672C\u8A9E\u306E\u5B57\u5E55\u30B5\u30F3\u30D7\u30EB\u3067\u3059\u3002", "\u5B57\u5E55\u306F\u6A19\u6E96\u306EWebVTT\u5F62\u5F0F\u3067\u3059\u3002", "\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u30E1\u30CB\u30E5\u30FC\u3067\u8A00\u8A9E\u3092\u5207\u308A\u66FF\u3048\u3089\u308C\u307E\u3059\u3002"];
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `00:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.000`.replace(/^00:00:/, "00:00:");
  };
  const cues = [];
  for (let i = 0; i < 60; i++) {
    const t = i * 5;
    cues.push(`${i + 1}
${fmt(t)} --> ${fmt(t + 4)}
${lines[i % lines.length]}`);
  }
  return `WEBVTT

${cues.join("\n\n")}
`;
}

// src/routes/admin.ts
import { Router } from "express";
import { z as z2 } from "zod";

// src/providers/jikan/jikanProvider.ts
var MIN_INTERVAL_MS = 450;
var lastCall = 0;
async function throttledGet(path2) {
  const wait = lastCall + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
  const base = (env.metadataApiUrl || "https://api.jikan.moe/v4").replace(/\/$/, "");
  const res = await fetch(`${base}${path2}`, {
    headers: env.metadataApiKey ? { Authorization: `Bearer ${env.metadataApiKey}` } : {}
  });
  if (res.status === 404) return null;
  if (res.status === 429) throw new Error("Metadata API rate limit reached; try again later");
  if (!res.ok) throw new Error(`Metadata API error ${res.status} for ${path2}`);
  return await res.json();
}
var TYPES = { TV: "TV", Movie: "MOVIE", OVA: "OVA", ONA: "ONA", Special: "SPECIAL" };
function mapStatus(s) {
  if (s === "Currently Airing") return "AIRING";
  if (s === "Not yet aired") return "UPCOMING";
  return "FINISHED";
}
function mapAnime(a) {
  const from = a.aired?.from ? new Date(a.aired.from) : null;
  const img = a.images?.jpg?.large_image_url ?? a.images?.jpg?.image_url ?? null;
  const minutes = /(\d+)\s*min/.exec(a.duration ?? "")?.[1];
  return {
    externalId: String(a.mal_id),
    title: a.title_english || a.title,
    englishTitle: a.title_english,
    nativeTitle: a.title_japanese,
    synonyms: [a.title, ...a.title_synonyms ?? []].filter(Boolean),
    description: a.synopsis ?? "",
    coverImage: img,
    bannerImage: a.trailer?.images?.maximum_image_url ?? img,
    year: a.year ?? from?.getUTCFullYear() ?? null,
    month: from ? from.getUTCMonth() + 1 : null,
    season: a.season ? String(a.season).toUpperCase() : null,
    status: mapStatus(a.status),
    type: TYPES[a.type] ?? "TV",
    rating: a.score ?? null,
    popularity: a.members ?? 0,
    duration: minutes ? Number(minutes) : null,
    episodeCount: a.episodes ?? null,
    studio: a.studios?.[0]?.name ?? null,
    startDate: from,
    genres: [...a.genres ?? [], ...a.themes ?? []].map((g) => g.name)
  };
}
var JikanMetadataProvider = class {
  name = "jikan";
  async search(query) {
    const r = await throttledGet(`/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`);
    return (r?.data ?? []).map(mapAnime);
  }
  async getAnime(id) {
    const r = await throttledGet(`/anime/${encodeURIComponent(id)}/full`);
    return r?.data ? mapAnime(r.data) : null;
  }
  async getEpisodes(id) {
    const out = [];
    for (let page = 1; page <= 5; page++) {
      const r = await throttledGet(`/anime/${encodeURIComponent(id)}/episodes?page=${page}`);
      for (const e of r?.data ?? []) {
        out.push({
          seasonNumber: 1,
          episodeNumber: e.mal_id,
          title: e.title ?? `Episode ${e.mal_id}`,
          description: "",
          releaseDate: e.aired ? new Date(e.aired) : null
        });
      }
      if (!r?.pagination?.has_next_page) break;
    }
    return out;
  }
  async getSeasons() {
    return [{ number: 1, title: "Season 1" }];
  }
  async getSeasonAnime(year, season) {
    const r = await throttledGet(`/seasons/${year}/${season.toLowerCase()}?limit=25&sfw=true`);
    return (r?.data ?? []).map(mapAnime);
  }
  async listAnime(page) {
    const r = await throttledGet(`/seasons/now?page=${page}&limit=25&sfw=true`);
    return { items: (r?.data ?? []).map(mapAnime), hasMore: Boolean(r?.pagination?.has_next_page) && page < 4 };
  }
};

// src/providers/empty/emptyProvider.ts
var EmptyMetadataProvider = class {
  name = "none";
  async search() {
    return [];
  }
  async getAnime() {
    return null;
  }
  async getEpisodes() {
    return [];
  }
  async getSeasons() {
    return [];
  }
  async getSeasonAnime() {
    return [];
  }
  async listAnime() {
    return { items: [], hasMore: false };
  }
};

// src/providers/youtube/youtubeProvider.ts
var API = "https://www.googleapis.com/youtube/v3";
async function yt(path2, params) {
  if (!env.youtubeApiKey) throw new Error("YOUTUBE_API_KEY is not set");
  const qs = new URLSearchParams({ ...params, key: env.youtubeApiKey });
  const res = await fetch(`${API}/${path2}?${qs}`);
  if (!res.ok) {
    const msg = (await res.json().catch(() => null))?.error?.message ?? res.statusText;
    throw new Error(`YouTube API ${res.status}: ${msg}`);
  }
  return await res.json();
}
var best = (t) => (t?.maxres ?? t?.standard ?? t?.high ?? t?.medium ?? t?.default)?.url ?? null;
function isoMinutes(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return null;
  return Math.max(1, Math.round((+(m[1] ?? 0) * 3600 + +(m[2] ?? 0) * 60 + +(m[3] ?? 0)) / 60));
}
function seasonOf2(d) {
  const m = d.getUTCMonth();
  return m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
}
function cleanTitle(raw2) {
  const first = raw2.split(/[｜|]/)[0];
  const cleaned = first.replace(/[【[][^】\]]*(ani-?one|muse|asia|limited|free|english|sub|eng)[^】\]]*[】\]]/gi, " ").replace(/\((?:limited-time|limited)[^)]*\)/gi, " ").replace(/[《》【】]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || raw2.trim();
}
var channelLabel = (title) => title.replace(/\s*\b(Asia|ENG|Official)\b/g, "").trim() || title;
var watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
var YouTubeMetadataProvider = class {
  name = "youtube";
  cache = null;
  async channels() {
    const out = [];
    for (const raw2 of env.youtubeChannels) {
      const handle = raw2.startsWith("@") ? raw2 : `@${raw2}`;
      const r = await yt("channels", { part: "snippet", forHandle: handle });
      const c = r.items?.[0];
      if (c) out.push({ id: c.id, title: c.snippet.title });
    }
    return out;
  }
  toAnime(p, channelTitle) {
    const published = new Date(p.snippet.publishedAt);
    const art = best(p.snippet.thumbnails);
    const count = p.contentDetails?.itemCount ?? 0;
    return {
      externalId: p.id,
      title: cleanTitle(p.snippet.title),
      englishTitle: cleanTitle(p.snippet.title),
      synonyms: [],
      description: p.snippet.description || `Official release from ${channelTitle}.`,
      coverImage: art,
      bannerImage: art,
      year: published.getUTCFullYear(),
      month: published.getUTCMonth() + 1,
      season: seasonOf2(published),
      status: "FINISHED",
      type: count === 1 ? "MOVIE" : "TV",
      rating: null,
      popularity: 0,
      duration: null,
      episodeCount: count,
      studio: channelTitle,
      startDate: published,
      genres: [channelLabel(channelTitle)]
    };
  }
  async load() {
    if (this.cache) return this.cache;
    const all = [];
    for (const ch of await this.channels()) {
      let token;
      for (let i = 0; i < 4; i++) {
        const r = await yt("playlists", {
          part: "snippet,contentDetails",
          channelId: ch.id,
          maxResults: "50",
          ...token ? { pageToken: token } : {}
        });
        for (const p of r.items ?? []) if ((p.contentDetails?.itemCount ?? 0) > 0) all.push(this.toAnime(p, ch.title));
        token = r.nextPageToken;
        if (!token) break;
      }
    }
    all.sort((a, b) => (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0));
    all.forEach((a, i) => a.popularity = Math.max(1, 1e4 - i * 10));
    return this.cache = all;
  }
  async search(query) {
    const q = query.toLowerCase();
    return (await this.load()).filter((a) => a.title.toLowerCase().includes(q));
  }
  async getAnime(id) {
    return (await this.load()).find((a) => a.externalId === id) ?? null;
  }
  async getEpisodes(playlistId) {
    const items = [];
    let token;
    for (let i = 0; i < 4; i++) {
      const r = await yt("playlistItems", {
        part: "snippet,contentDetails",
        playlistId,
        maxResults: "50",
        ...token ? { pageToken: token } : {}
      });
      for (const it of r.items ?? []) {
        const id = it.contentDetails?.videoId;
        if (!id || it.snippet?.title === "Private video" || it.snippet?.title === "Deleted video") continue;
        items.push({
          id,
          title: cleanTitle(it.snippet.title),
          description: it.snippet.description ?? "",
          thumb: best(it.snippet.thumbnails),
          at: it.contentDetails.videoPublishedAt ?? it.snippet.publishedAt ?? null
        });
      }
      token = r.nextPageToken;
      if (!token) break;
    }
    const info = /* @__PURE__ */ new Map();
    for (let i = 0; i < items.length; i += 50) {
      const ids = items.slice(i, i + 50).map((x) => x.id).join(",");
      const r = await yt("videos", { part: "contentDetails,status", id: ids });
      for (const v of r.items ?? []) {
        info.set(v.id, { minutes: isoMinutes(v.contentDetails?.duration), embeddable: !!v.status?.embeddable });
      }
    }
    return items.filter((x) => info.get(x.id)?.embeddable).map((x, n) => ({
      seasonNumber: 1,
      episodeNumber: n + 1,
      title: x.title,
      description: x.description.slice(0, 600),
      thumbnail: x.thumb,
      releaseDate: x.at ? new Date(x.at) : null,
      duration: info.get(x.id)?.minutes ?? null,
      mediaUrl: watchUrl(x.id)
    }));
  }
  async getSeasons() {
    return [{ number: 1, title: "Season 1" }];
  }
  async getSeasonAnime(year, season) {
    return (await this.load()).filter((a) => a.year === year && a.season === season.toUpperCase());
  }
  async listAnime() {
    return { items: await this.load(), hasMore: false };
  }
};

// src/providers/library/libraryProviders.ts
var LibraryVideoProvider = class {
  name = "library";
  async getVideo(_animeId, episodeId) {
    const sources = await db.mediaSource.findMany({ where: { episodeId }, orderBy: { createdAt: "asc" } });
    if (sources.length === 0) return null;
    return {
      url: sources[0].url,
      mimeType: sources[0].mimeType,
      qualities: sources.map((s) => ({ label: s.quality, url: s.url }))
    };
  }
};
var LibrarySubtitleProvider = class {
  name = "library";
  async getSubtitles(episodeId) {
    const rows = await db.subtitle.findMany({ where: { episodeId } });
    return rows.map((s) => ({ language: s.language, label: s.label, url: s.url }));
  }
};

// src/providers/registry.ts
function getMetadataProvider() {
  switch (env.metadataProvider) {
    case "jikan":
      return new JikanMetadataProvider();
    case "none":
      return new EmptyMetadataProvider();
    // catalog comes only from catalog/library.json
    case "youtube":
      return new YouTubeMetadataProvider();
    default:
      return new MockMetadataProvider();
  }
}
function getVideoProvider() {
  return env.videoProvider === "library" ? new LibraryVideoProvider() : new MockVideoProvider();
}
function getSubtitleProvider() {
  return env.videoProvider === "library" ? new LibrarySubtitleProvider() : new MockSubtitleProvider();
}

// src/sync/syncService.ts
var expired = (o) => o?.deadline != null && Date.now() > o.deadline;
var emptyStats = () => ({ animeAdded: 0, animeUpdated: 0, episodesAdded: 0, errors: [] });
function animeData(a) {
  return {
    title: a.title,
    englishTitle: a.englishTitle ?? null,
    nativeTitle: a.nativeTitle ?? null,
    synonyms: a.synonyms,
    description: a.description,
    coverImage: a.coverImage ?? null,
    bannerImage: a.bannerImage ?? null,
    year: a.year ?? null,
    month: a.month ?? null,
    season: a.season ?? null,
    status: a.status,
    type: a.type,
    rating: a.rating ?? null,
    popularity: a.popularity,
    duration: a.duration ?? null,
    episodeCount: a.episodeCount ?? null,
    studio: a.studio ?? null,
    startDate: a.startDate ?? null
  };
}
async function setGenres(animeId, names) {
  const genres = await Promise.all(
    [...new Set(names)].map((name) => db.genre.upsert({ where: { name }, update: {}, create: { name } }))
  );
  await db.animeGenre.deleteMany({ where: { animeId } });
  if (genres.length) {
    await db.animeGenre.createMany({ data: genres.map((g) => ({ animeId, genreId: g.id })), skipDuplicates: true });
  }
}
async function upsertAnime(a) {
  const existing = await db.anime.findUnique({ where: { externalId: a.externalId }, select: { id: true } });
  const data = animeData(a);
  const row = existing ? await db.anime.update({ where: { id: existing.id }, data }) : await db.anime.create({ data: { ...data, externalId: a.externalId } });
  await setGenres(row.id, a.genres);
  return { id: row.id, created: !existing };
}
async function syncAnime(provider = getMetadataProvider(), opts) {
  const stats = emptyStats();
  for (let page = 1; page < 50 && !expired(opts); page++) {
    try {
      const { items, hasMore } = await provider.listAnime(page);
      for (const a of items) {
        const { created } = await upsertAnime(a);
        if (created) stats.animeAdded++;
        else stats.animeUpdated++;
      }
      if (!hasMore) break;
    } catch (e) {
      stats.errors.push(`syncAnime page ${page}: ${e.message}`);
      break;
    }
  }
  return stats;
}
async function syncSeasons(provider = getMetadataProvider(), opts) {
  const stats = emptyStats();
  const list = await db.anime.findMany({ where: { externalId: { not: null } }, select: { id: true, externalId: true } });
  for (const a of list) {
    if (expired(opts)) break;
    try {
      for (const s of await provider.getSeasons(a.externalId)) {
        await db.season.upsert({
          where: { animeId_number: { animeId: a.id, number: s.number } },
          update: { title: s.title },
          create: { animeId: a.id, number: s.number, title: s.title }
        });
      }
    } catch (e) {
      stats.errors.push(`syncSeasons ${a.externalId}: ${e.message}`);
    }
  }
  return stats;
}
async function syncEpisodes(provider = getMetadataProvider(), opts) {
  const stats = emptyStats();
  const list = await db.anime.findMany({
    where: { externalId: { not: null } },
    orderBy: [{ episodesSyncedAt: { sort: "asc", nulls: "first" } }, { popularity: "desc" }],
    select: { id: true, externalId: true, status: true, episodesSyncedAt: true }
  });
  const now = Date.now();
  for (const a of list) {
    if (expired(opts)) break;
    const ttl = a.status === "FINISHED" ? 7 * 24 * 3600 * 1e3 : 12 * 3600 * 1e3;
    if (a.episodesSyncedAt && now - a.episodesSyncedAt.getTime() < ttl) continue;
    try {
      const seasons = await db.season.findMany({ where: { animeId: a.id } });
      const bySeason = new Map(seasons.map((s) => [s.number, s.id]));
      for (const e of await provider.getEpisodes(a.externalId)) {
        let seasonId = bySeason.get(e.seasonNumber);
        if (!seasonId) {
          const s = await db.season.upsert({
            where: { animeId_number: { animeId: a.id, number: e.seasonNumber } },
            update: {},
            create: { animeId: a.id, number: e.seasonNumber, title: `Season ${e.seasonNumber}` }
          });
          seasonId = s.id;
          bySeason.set(e.seasonNumber, seasonId);
        }
        const found = await db.episode.findFirst({
          where: { animeId: a.id, seasonId, episodeNumber: e.episodeNumber },
          select: { id: true }
        });
        const data = {
          title: e.title,
          description: e.description,
          thumbnail: e.thumbnail ?? null,
          releaseDate: e.releaseDate ?? null,
          duration: e.duration ?? null
        };
        let episodeId = found?.id;
        if (found) await db.episode.update({ where: { id: found.id }, data });
        else {
          episodeId = (await db.episode.create({ data: { ...data, animeId: a.id, seasonId, episodeNumber: e.episodeNumber } })).id;
          stats.episodesAdded++;
        }
        if (e.mediaUrl && episodeId) {
          const has = await db.mediaSource.findFirst({ where: { episodeId, url: e.mediaUrl }, select: { id: true } });
          if (!has) await db.mediaSource.create({ data: { episodeId, url: e.mediaUrl, quality: "auto", mimeType: "video/youtube" } });
        }
      }
      await db.anime.update({ where: { id: a.id }, data: { episodesSyncedAt: /* @__PURE__ */ new Date() } });
    } catch (err) {
      stats.errors.push(`syncEpisodes ${a.externalId}: ${err.message}`);
    }
  }
  return stats;
}
async function pruneEmpty() {
  const r = await db.anime.deleteMany({
    where: {
      externalId: { not: null },
      NOT: { externalId: { startsWith: "lib:" } },
      episodesSyncedAt: { not: null },
      episodes: { none: {} }
    }
  });
  return r.count;
}
async function syncMetadata(provider = getMetadataProvider(), opts) {
  const stats = emptyStats();
  const list = await db.anime.findMany({
    where: { externalId: { not: null }, status: { in: ["AIRING", "UPCOMING"] } },
    select: { externalId: true }
  });
  for (const a of list) {
    if (expired(opts)) break;
    try {
      const fresh = await provider.getAnime(a.externalId);
      if (!fresh) continue;
      await upsertAnime(fresh);
      stats.animeUpdated++;
    } catch (e) {
      stats.errors.push(`syncMetadata ${a.externalId}: ${e.message}`);
    }
  }
  return stats;
}
async function runFullSync(provider = getMetadataProvider(), opts) {
  const run = await db.syncRun.create({ data: { provider: provider.name } });
  const total = emptyStats();
  for (const step of [syncAnime, syncSeasons, syncEpisodes, syncMetadata]) {
    try {
      const s = await step(provider, opts);
      total.animeAdded += s.animeAdded;
      total.animeUpdated += s.animeUpdated;
      total.episodesAdded += s.episodesAdded;
      total.errors.push(...s.errors);
    } catch (e) {
      total.errors.push(`${step.name}: ${e.message}`);
    }
  }
  await pruneEmpty().catch((e) => total.errors.push(`pruneEmpty: ${e.message}`));
  await db.syncRun.update({
    where: { id: run.id },
    data: { ...total, errors: total.errors.slice(0, 50), finishedAt: /* @__PURE__ */ new Date() }
  });
  return total;
}

// src/routes/admin.ts
var admin = Router();
admin.use(requireAdmin);
admin.get("/stats", async (_req, res) => {
  const [anime, episodes, airing, lastSync, recent] = await Promise.all([
    db.anime.count(),
    db.episode.count(),
    db.anime.count({ where: { status: "AIRING" } }),
    db.syncRun.findFirst({ orderBy: { startedAt: "desc" } }),
    db.anime.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, createdAt: true } })
  ]);
  res.json({
    anime,
    episodes,
    airing,
    lastSync,
    recent,
    providers: { metadata: env.metadataProvider, video: env.videoProvider }
  });
});
var syncing = false;
admin.post("/sync", async (_req, res) => {
  if (syncing) throw new HttpError(409, "A sync is already running");
  syncing = true;
  runFullSync().finally(() => syncing = false);
  res.status(202).json({ started: true });
});
admin.post("/media-sources", async (req, res) => {
  const body = parse(
    z2.object({
      episodeId: idParam,
      url: z2.url({ protocol: /^https?$/ }).max(2e3),
      quality: z2.string().max(20).default("auto"),
      mimeType: z2.string().max(60).optional(),
      note: z2.string().max(200).optional()
    }),
    req.body
  );
  res.status(201).json(await db.mediaSource.create({ data: body }));
});
admin.post("/subtitles", async (req, res) => {
  const body = parse(
    z2.object({
      episodeId: idParam,
      language: z2.string().min(2).max(10),
      label: z2.string().min(1).max(40),
      url: z2.url({ protocol: /^https?$/ }).max(2e3)
    }),
    req.body
  );
  res.status(201).json(await db.subtitle.create({ data: body }));
});

// src/routes/catalog.ts
import { Router as Router2 } from "express";
import { z as z4 } from "zod";

// src/services/anime.ts
import { z as z3 } from "zod";
var cardSelect = {
  id: true,
  title: true,
  englishTitle: true,
  nativeTitle: true,
  coverImage: true,
  bannerImage: true,
  description: true,
  year: true,
  season: true,
  status: true,
  type: true,
  rating: true,
  episodeCount: true,
  duration: true,
  genres: { select: { genre: { select: { name: true } } } }
};
function toCard(a) {
  const { genres, ...rest } = a;
  return { ...rest, genres: genres.map((g) => g.genre.name) };
}
var SORTS = {
  recentlyAdded: { createdAt: "desc" },
  recentlyUpdated: { updatedAt: "desc" },
  newest: { startDate: { sort: "desc", nulls: "last" } },
  oldest: { startDate: { sort: "asc", nulls: "last" } },
  az: { title: "asc" },
  za: { title: "desc" },
  rating: { rating: { sort: "desc", nulls: "last" } },
  popular: { popularity: "desc" }
};
var csv = z3.string().optional().transform((v) => v ? v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10) : []);
var filterSchema = z3.object({
  q: z3.string().trim().max(100).optional(),
  genres: csv,
  year: z3.coerce.number().int().min(1950).max(2100).optional(),
  month: z3.coerce.number().int().min(1).max(12).optional(),
  season: z3.enum(["WINTER", "SPRING", "SUMMER", "FALL"]).optional(),
  status: z3.enum(["AIRING", "FINISHED", "UPCOMING", "CANCELLED"]).optional(),
  type: z3.enum(["TV", "MOVIE", "OVA", "ONA", "SPECIAL"]).optional(),
  studio: z3.string().trim().max(80).optional(),
  minRating: z3.coerce.number().min(0).max(10).optional(),
  sort: z3.enum(Object.keys(SORTS)).default("popular"),
  page: z3.coerce.number().int().min(1).max(500).default(1),
  limit: z3.coerce.number().int().min(1).max(50).default(24)
});
function buildWhere(f) {
  const and = [];
  if (f.q) {
    const q = f.q;
    const asYear = /^\d{4}$/.test(q) ? Number(q) : null;
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { englishTitle: { contains: q, mode: "insensitive" } },
        { nativeTitle: { contains: q, mode: "insensitive" } },
        { synonyms: { has: q } },
        { studio: { contains: q, mode: "insensitive" } },
        { genres: { some: { genre: { name: { contains: q, mode: "insensitive" } } } } },
        ...asYear ? [{ year: asYear }] : []
      ]
    });
  }
  for (const g of f.genres ?? []) {
    and.push({ genres: { some: { genre: { name: { equals: g, mode: "insensitive" } } } } });
  }
  if (f.year) and.push({ year: f.year });
  if (f.month) and.push({ month: f.month });
  if (f.season) and.push({ season: f.season });
  if (f.status) and.push({ status: f.status });
  if (f.type) and.push({ type: f.type });
  if (f.studio) and.push({ studio: { contains: f.studio, mode: "insensitive" } });
  if (f.minRating) and.push({ rating: { gte: f.minRating } });
  return and.length ? { AND: and } : {};
}
async function listAnime(f) {
  const where = buildWhere(f);
  const [rows, total] = await Promise.all([
    db.anime.findMany({
      where,
      select: cardSelect,
      orderBy: [SORTS[f.sort], { id: "asc" }],
      skip: (f.page - 1) * f.limit,
      take: f.limit
    }),
    db.anime.count({ where })
  ]);
  return { items: rows.map(toCard), page: f.page, total, hasMore: f.page * f.limit < total };
}
async function getAnimeDetail(id) {
  const a = await db.anime.findUnique({
    where: { id },
    include: {
      genres: { select: { genre: { select: { name: true } } } },
      seasons: { orderBy: { number: "asc" } }
    }
  });
  if (!a) return null;
  const { genres, ...rest } = a;
  return { ...rest, genres: genres.map((g) => g.genre.name) };
}
async function relatedAnime(id, limit = 12) {
  const a = await db.anime.findUnique({ where: { id }, select: { genres: { select: { genreId: true } } } });
  if (!a) return [];
  const rows = await db.anime.findMany({
    where: { id: { not: id }, genres: { some: { genreId: { in: a.genres.map((g) => g.genreId) } } } },
    select: cardSelect,
    orderBy: { popularity: "desc" },
    take: limit
  });
  return rows.map(toCard);
}
async function listGenres() {
  const rows = await db.genre.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { anime: true } } }
  });
  return rows.map((g) => ({ id: g.id, name: g.name, count: g._count.anime }));
}
async function seasonAnime(year, season, genre) {
  const where = buildWhere({
    year,
    season: season.toUpperCase(),
    genres: genre ? [genre] : []
  });
  const rows = await db.anime.findMany({ where, select: cardSelect, orderBy: { popularity: "desc" }, take: 100 });
  return rows.map(toCard);
}
async function newAnime() {
  const now = /* @__PURE__ */ new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day2 = 24 * 3600 * 1e3;
  const weekAgo = new Date(startOfDay.getTime() - 7 * day2);
  const monthAgo = new Date(startOfDay.getTime() - 30 * day2);
  const take = 20;
  const q = (where, orderBy) => db.anime.findMany({ where, select: cardSelect, orderBy, take }).then((r) => r.map(toCard));
  const released = (from, to) => ({
    episodes: { some: { releaseDate: { gte: from, lt: to } } }
  });
  const tomorrow = new Date(startOfDay.getTime() + day2);
  const playable = { episodes: { some: {} } };
  const [today, week, month, recentlyAdded, recentlyUpdated, upcoming] = await Promise.all([
    q(released(startOfDay, tomorrow), { updatedAt: "desc" }),
    q(released(weekAgo, tomorrow), { popularity: "desc" }),
    q(released(monthAgo, tomorrow), { popularity: "desc" }),
    q(playable, { createdAt: "desc" }),
    q(playable, { updatedAt: "desc" }),
    q({ OR: [{ status: "UPCOMING" }, { episodes: { some: { releaseDate: { gte: tomorrow } } } }] }, { startDate: "asc" })
  ]);
  return { today, week, month, recentlyAdded, recentlyUpdated, upcoming };
}

// src/services/calendar.ts
var day = 24 * 3600 * 1e3;
async function releasesOn(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + day);
  const [episodes, premieres] = await Promise.all([
    db.episode.findMany({
      where: { releaseDate: { gte: start, lt: end } },
      orderBy: { releaseDate: "asc" },
      select: {
        id: true,
        episodeNumber: true,
        title: true,
        thumbnail: true,
        releaseDate: true,
        anime: { select: { id: true, title: true, coverImage: true } }
      },
      take: 100
    }),
    db.anime.findMany({ where: { startDate: { gte: start, lt: end } }, select: cardSelect, take: 50 })
  ]);
  return { date: start.toISOString().slice(0, 10), episodes, premieres: premieres.map(toCard) };
}
async function monthSummary(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rows = await db.episode.findMany({
    where: { releaseDate: { gte: start, lt: end } },
    select: { releaseDate: true }
  });
  const counts = {};
  for (const r of rows) {
    const k = r.releaseDate.toISOString().slice(0, 10);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

// src/services/episodes.ts
var episodeSelect = {
  id: true,
  animeId: true,
  seasonId: true,
  episodeNumber: true,
  title: true,
  description: true,
  thumbnail: true,
  releaseDate: true,
  duration: true
};
async function episodesForAnime(animeId, userId) {
  const [seasons, episodes, progress] = await Promise.all([
    db.season.findMany({ where: { animeId }, orderBy: { number: "asc" } }),
    db.episode.findMany({
      where: { animeId },
      select: episodeSelect,
      orderBy: [{ season: { number: "asc" } }, { episodeNumber: "asc" }]
    }),
    userId ? db.watchProgress.findMany({ where: { userId, animeId } }) : Promise.resolve([])
  ]);
  const prog = new Map(progress.map((p) => [p.episodeId, p]));
  const withProgress = episodes.map((e) => {
    const p = prog.get(e.id);
    return {
      ...e,
      progressSeconds: p?.progressSeconds ?? 0,
      durationSeconds: p?.durationSeconds ?? 0,
      completed: p?.completed ?? false
    };
  });
  const grouped = seasons.map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title,
    episodes: withProgress.filter((e) => e.seasonId === s.id)
  }));
  const loose = withProgress.filter((e) => !e.seasonId);
  if (loose.length) grouped.push({ id: "none", number: 0, title: "Episodes", episodes: loose });
  return grouped;
}
async function latestEpisodes(limit = 20) {
  const rows = await db.episode.findMany({
    where: { releaseDate: { lte: /* @__PURE__ */ new Date() } },
    orderBy: { releaseDate: "desc" },
    take: limit,
    select: {
      ...episodeSelect,
      anime: { select: { id: true, title: true, coverImage: true, bannerImage: true } }
    }
  });
  return rows;
}
async function playbackInfo(episodeId, userId) {
  const ep = await db.episode.findUnique({
    where: { id: episodeId },
    select: { ...episodeSelect, season: { select: { number: true } }, anime: { select: { id: true, title: true } } }
  });
  if (!ep) return null;
  const ordered = await db.episode.findMany({
    where: { animeId: ep.animeId },
    orderBy: [{ season: { number: "asc" } }, { episodeNumber: "asc" }],
    select: { id: true, episodeNumber: true, title: true }
  });
  const idx = ordered.findIndex((e) => e.id === ep.id);
  const [video, subtitles, progress] = await Promise.all([
    getVideoProvider().getVideo(ep.animeId, ep.id),
    getSubtitleProvider().getSubtitles(ep.id),
    userId ? db.watchProgress.findUnique({ where: { userId_episodeId: { userId, episodeId } } }) : null
  ]);
  return {
    episode: ep,
    video,
    // null → "Video unavailable"
    subtitles,
    previous: idx > 0 ? ordered[idx - 1] : null,
    next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
    progress: progress ? { progressSeconds: progress.progressSeconds, durationSeconds: progress.durationSeconds, completed: progress.completed } : null
  };
}

// src/services/recommendations.ts
var GenreAffinityRecommender = class {
  async recommend(userId, limit) {
    const weights = /* @__PURE__ */ new Map();
    const owned = /* @__PURE__ */ new Set();
    if (userId) {
      const [progress, list] = await Promise.all([
        db.watchProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 30,
          select: { animeId: true, completed: true, anime: { select: { genres: { select: { genre: { select: { name: true } } } } } } }
        }),
        db.watchlist.findMany({
          where: { userId },
          select: { animeId: true, status: true, anime: { select: { genres: { select: { genre: { select: { name: true } } } } } } }
        })
      ]);
      const add = (genres, w) => genres.forEach((g) => weights.set(g.genre.name, (weights.get(g.genre.name) ?? 0) + w));
      progress.forEach((p, i) => {
        owned.add(p.animeId);
        add(p.anime.genres, (p.completed ? 3 : 2) * (1 - i / 40));
      });
      list.forEach((l) => {
        owned.add(l.animeId);
        if (l.status !== "DROPPED") add(l.anime.genres, l.status === "COMPLETED" ? 3 : 1.5);
      });
    }
    const candidates = await db.anime.findMany({
      where: { id: { notIn: [...owned] } },
      select: { ...cardSelect, popularity: true },
      orderBy: { popularity: "desc" },
      take: 200
    });
    const maxPop = Math.max(1, ...candidates.map((c) => c.popularity));
    const scored = candidates.map((c) => {
      const names = c.genres.map((g) => g.genre.name);
      const hits = names.filter((n) => weights.has(n));
      const genreScore = hits.reduce((s, n) => s + (weights.get(n) ?? 0), 0) + (hits.length > 1 ? hits.length : 0);
      const score = genreScore * 10 + c.popularity / maxPop * 5 + (c.rating ?? 0);
      return { c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(({ c }) => {
      const { popularity: _p, ...rest } = c;
      return toCard(rest);
    });
  }
};
var recommender = new GenreAffinityRecommender();

// src/services/watch.ts
async function saveProgress(userId, input) {
  const ep = await db.episode.findUnique({ where: { id: input.episodeId }, select: { animeId: true } });
  if (!ep) return null;
  const completed = input.durationSeconds > 0 && input.progressSeconds / input.durationSeconds >= 0.92;
  const row = await db.watchProgress.upsert({
    where: { userId_episodeId: { userId, episodeId: input.episodeId } },
    update: { progressSeconds: input.progressSeconds, durationSeconds: input.durationSeconds, completed },
    create: { userId, animeId: ep.animeId, ...input, completed }
  });
  await db.watchlist.upsert({
    where: { userId_animeId: { userId, animeId: ep.animeId } },
    update: {},
    create: { userId, animeId: ep.animeId, status: "WATCHING" }
  });
  return row;
}
var progressInclude = {
  anime: { select: cardSelect },
  episode: { select: { id: true, episodeNumber: true, title: true, thumbnail: true, season: { select: { number: true } } } }
};
async function latestPerAnime(userId, where, take) {
  const rows = await db.watchProgress.findMany({
    where: { userId, ...where },
    orderBy: { updatedAt: "desc" },
    include: progressInclude,
    take: 200
  });
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.animeId)) continue;
    seen.add(r.animeId);
    out.push({
      id: r.id,
      animeId: r.animeId,
      episodeId: r.episodeId,
      progressSeconds: r.progressSeconds,
      durationSeconds: r.durationSeconds,
      completed: r.completed,
      updatedAt: r.updatedAt,
      anime: toCard(r.anime),
      episode: { ...r.episode, seasonNumber: r.episode.season?.number ?? 1 }
    });
    if (out.length >= take) break;
  }
  return out;
}
var continueWatching = (userId) => latestPerAnime(userId, { completed: false, progressSeconds: { gt: 5 } }, 20);
var history = (userId) => latestPerAnime(userId, {}, 100);
async function removeHistoryItem(userId, animeId) {
  await db.watchProgress.deleteMany({ where: { userId, animeId } });
}
async function clearHistory(userId) {
  await db.watchProgress.deleteMany({ where: { userId } });
}
async function getList(userId, status) {
  const rows = await db.watchlist.findMany({
    where: { userId, ...status ? { status } : {} },
    orderBy: { updatedAt: "desc" },
    include: { anime: { select: cardSelect } }
  });
  return rows.map((r) => ({ animeId: r.animeId, status: r.status, createdAt: r.createdAt, anime: toCard(r.anime) }));
}
async function setListStatus(userId, animeId, status) {
  return db.watchlist.upsert({
    where: { userId_animeId: { userId, animeId } },
    update: { status },
    create: { userId, animeId, status }
  });
}
async function removeFromList(userId, animeId) {
  await db.watchlist.deleteMany({ where: { userId, animeId } });
}

// src/routes/catalog.ts
var catalog = Router2();
catalog.get("/home", async (req, res) => {
  const take = (orderBy, where = {}, n = 15) => db.anime.findMany({ where, select: cardSelect, orderBy, take: n }).then((r) => r.map(toCard));
  const recent = { OR: [{ status: "AIRING" }, { episodes: { some: { releaseDate: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1e3), lte: /* @__PURE__ */ new Date() } } } }] };
  const playable = { episodes: { some: {} } };
  const [hero, recentlyAdded, trending, popularSeason, airing, fresh, recentlyUpdated, latest, recommended, cont, genres] = await Promise.all([
    take({ popularity: "desc" }, { bannerImage: { not: null }, ...playable }, 5),
    take({ createdAt: "desc" }, playable),
    take({ popularity: "desc" }, playable),
    take({ popularity: "desc" }, recent),
    take({ startDate: "desc" }, recent),
    take({ startDate: { sort: "desc", nulls: "last" } }, playable),
    take({ updatedAt: "desc" }, playable),
    latestEpisodes(15),
    recommender.recommend(req.userId, 15),
    req.userId ? continueWatching(req.userId) : Promise.resolve([]),
    listGenres()
  ]);
  res.json({ hero, continueWatching: cont, recentlyAdded, latestEpisodes: latest, trending, popularSeason, airing, newAnime: fresh, recommended, recentlyUpdated, genres });
});
catalog.get("/anime", async (req, res) => {
  res.json(await listAnime(parse(filterSchema, req.query)));
});
catalog.get("/anime/new", async (_req, res) => {
  res.json(await newAnime());
});
catalog.get("/anime/:id", async (req, res) => {
  const a = await getAnimeDetail(parse(idParam, req.params.id));
  if (!a) throw new HttpError(404, "Anime not found");
  res.json(a);
});
catalog.get("/anime/:id/episodes", async (req, res) => {
  const id = parse(idParam, req.params.id);
  res.json({ seasons: await episodesForAnime(id, req.userId) });
});
catalog.get("/anime/:id/seasons", async (req, res) => {
  res.json(await db.season.findMany({ where: { animeId: parse(idParam, req.params.id) }, orderBy: { number: "asc" } }));
});
catalog.get("/anime/:id/related", async (req, res) => {
  res.json(await relatedAnime(parse(idParam, req.params.id)));
});
catalog.get("/genres", async (_req, res) => {
  res.json(await listGenres());
});
catalog.get("/seasons/:year/:season", async (req, res) => {
  const p = parse(
    z4.object({ year: z4.coerce.number().int().min(1950).max(2100), season: z4.enum(["winter", "spring", "summer", "fall"]) }),
    req.params
  );
  const genre = typeof req.query.genre === "string" ? req.query.genre.slice(0, 40) : void 0;
  res.json({ items: await seasonAnime(p.year, p.season, genre) });
});
catalog.get("/calendar/month/:ym", async (req, res) => {
  const m = /^(\d{4})-(\d{2})$/.exec(req.params.ym);
  if (!m) throw new HttpError(400, "Expected YYYY-MM");
  res.json(await monthSummary(Number(m[1]), Number(m[2])));
});
catalog.get("/calendar/:date", async (req, res) => {
  const d = /* @__PURE__ */ new Date(`${req.params.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date) || Number.isNaN(d.getTime())) throw new HttpError(400, "Expected YYYY-MM-DD");
  res.json(await releasesOn(d));
});
catalog.get("/episodes/latest", async (_req, res) => {
  res.json(await latestEpisodes(30));
});
catalog.get("/episodes/:id/playback", async (req, res) => {
  const info = await playbackInfo(parse(idParam, req.params.id), req.userId);
  if (!info) throw new HttpError(404, "Episode not found");
  const origin = `${req.protocol}://${req.get("host")}`;
  info.subtitles = info.subtitles.map((s) => ({ ...s, url: s.url.replace(env.apiUrl, origin) }));
  res.json(info);
});
catalog.get("/recommendations", async (req, res) => {
  res.json({ items: await recommender.recommend(req.userId, 20) });
});

// src/routes/cron.ts
import { timingSafeEqual as timingSafeEqual2 } from "node:crypto";
import { Router as Router3 } from "express";
var cron = Router3();
cron.get("/cron/sync", async (req, res) => {
  const given = req.headers.authorization ?? "";
  const expected = `Bearer ${env.cronSecret}`;
  const ok = env.cronSecret && given.length === expected.length && timingSafeEqual2(Buffer.from(given), Buffer.from(expected));
  if (!ok) throw new HttpError(401, "Unauthorized");
  const stats = await runFullSync(void 0, { deadline: Date.now() + 24e4 });
  res.json(stats);
});

// src/routes/user.ts
import { Router as Router4 } from "express";
import rateLimit from "express-rate-limit";
import { z as z5 } from "zod";
var user = Router4();
var listStatus = z5.enum(["WATCHING", "PLAN_TO_WATCH", "COMPLETED", "DROPPED"]);
var authLimiter = rateLimit({ windowMs: 15 * 60 * 1e3, limit: 20, standardHeaders: true, legacyHeaders: false });
user.post("/auth/anonymous", authLimiter, async (req, res) => {
  const { username } = parse(z5.object({ username: z5.string().trim().min(1).max(30).default("Otaku") }), req.body ?? {});
  const token = newToken();
  const u = await db.user.create({ data: { username, tokenHash: hashToken(token) }, select: { id: true, username: true } });
  res.status(201).json({ token, user: u });
});
user.get("/auth/me", requireAuth, async (req, res) => {
  const u = await db.user.findUnique({ where: { id: req.userId }, select: { id: true, username: true, createdAt: true } });
  if (!u) throw new HttpError(401, "Authentication required");
  res.json(u);
});
user.patch("/auth/me", requireAuth, async (req, res) => {
  const { username } = parse(z5.object({ username: z5.string().trim().min(1).max(30) }), req.body);
  res.json(await db.user.update({ where: { id: req.userId }, data: { username }, select: { id: true, username: true } }));
});
user.get("/search", async (req, res) => {
  const q = parse(z5.string().trim().min(1).max(100), req.query.q);
  const page = parse(z5.coerce.number().int().min(1).max(100).default(1), req.query.page);
  res.json(await listAnime({ q, genres: [], sort: "popular", page, limit: 24 }));
});
user.get("/search/popular", async (_req, res) => {
  const rows = await db.anime.findMany({ orderBy: { popularity: "desc" }, take: 8, select: { title: true } });
  res.json(rows.map((r) => r.title));
});
user.get("/search/history", requireAuth, async (req, res) => {
  const rows = await db.searchHistory.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, take: 10 });
  res.json(rows.map((r) => r.query));
});
user.post("/search/history", requireAuth, async (req, res) => {
  const { query } = parse(z5.object({ query: z5.string().trim().min(1).max(100) }), req.body);
  await db.searchHistory.upsert({
    where: { userId_query: { userId: req.userId, query } },
    update: { createdAt: /* @__PURE__ */ new Date() },
    create: { userId: req.userId, query }
  });
  res.status(204).end();
});
user.delete("/search/history", requireAuth, async (req, res) => {
  await db.searchHistory.deleteMany({ where: { userId: req.userId } });
  res.status(204).end();
});
user.post("/watch-progress", requireAuth, async (req, res) => {
  const body = parse(
    z5.object({
      episodeId: idParam,
      progressSeconds: z5.number().int().min(0).max(86400),
      durationSeconds: z5.number().int().min(0).max(86400)
    }),
    req.body
  );
  const row = await saveProgress(req.userId, body);
  if (!row) throw new HttpError(404, "Episode not found");
  res.json({ completed: row.completed });
});
user.get("/watch-progress", requireAuth, async (req, res) => {
  const kind = req.query.kind === "history" ? "history" : "continue";
  res.json(kind === "history" ? await history(req.userId) : await continueWatching(req.userId));
});
user.delete("/watch-progress", requireAuth, async (req, res) => {
  await clearHistory(req.userId);
  res.status(204).end();
});
user.delete("/watch-progress/:animeId", requireAuth, async (req, res) => {
  await removeHistoryItem(req.userId, parse(idParam, req.params.animeId));
  res.status(204).end();
});
user.get("/watchlist", requireAuth, async (req, res) => {
  const status = req.query.status ? parse(listStatus, req.query.status) : void 0;
  res.json(await getList(req.userId, status));
});
user.post("/watchlist", requireAuth, async (req, res) => {
  const body = parse(z5.object({ animeId: idParam, status: listStatus.default("PLAN_TO_WATCH") }), req.body);
  const exists = await db.anime.findUnique({ where: { id: body.animeId }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Anime not found");
  const row = await setListStatus(req.userId, body.animeId, body.status);
  res.status(201).json({ animeId: row.animeId, status: row.status });
});
user.delete("/watchlist/:animeId", requireAuth, async (req, res) => {
  await removeFromList(req.userId, parse(idParam, req.params.animeId));
  res.status(204).end();
});
user.post("/notifications/token", requireAuth, async (req, res) => {
  const body = parse(z5.object({ token: z5.string().min(10).max(300), platform: z5.enum(["ios", "android"]) }), req.body);
  await db.pushToken.upsert({
    where: { token: body.token },
    update: { userId: req.userId, platform: body.platform },
    create: { userId: req.userId, ...body }
  });
  res.status(204).end();
});
var prefsSchema = z5.object({ newEpisodes: z5.boolean(), newAnime: z5.boolean(), recommendations: z5.boolean() });
user.get("/notifications/prefs", requireAuth, async (req, res) => {
  const p = await db.notificationPrefs.findUnique({ where: { userId: req.userId } });
  res.json(p ?? { newEpisodes: true, newAnime: false, recommendations: false });
});
user.put("/notifications/prefs", requireAuth, async (req, res) => {
  const data = parse(prefsSchema, req.body);
  res.json(
    await db.notificationPrefs.upsert({ where: { userId: req.userId }, update: data, create: { userId: req.userId, ...data } })
  );
});

// src/app.ts
function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
  app.use(express.json({ limit: "20kb" }));
  app.use(
    "/api",
    rateLimit2({ windowMs: 60 * 1e3, limit: 300, standardHeaders: true, legacyHeaders: false })
  );
  app.get("/api/health", async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });
  app.get("/api/subtitles/mock/:episodeId/:lang.vtt", (req, res) => {
    const lang = req.params.lang === "ja" ? "ja" : "en";
    res.type("text/vtt").send(mockVtt(lang));
  });
  app.use("/api", cron);
  app.use("/api/admin", admin);
  app.use("/api", optionalAuth, catalog, user);
  app.use((_req, _res, next) => next(new HttpError(404, "Not found")));
  app.use(errorHandler);
  return app;
}

// src/vercel.ts
var vercel_default = createApp();
export {
  vercel_default as default
};
