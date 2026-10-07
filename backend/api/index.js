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
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum AnimeStatus {\n  AIRING\n  FINISHED\n  UPCOMING\n  CANCELLED\n}\n\nenum AnimeType {\n  TV\n  MOVIE\n  OVA\n  ONA\n  SPECIAL\n}\n\nenum AnimeSeason {\n  WINTER\n  SPRING\n  SUMMER\n  FALL\n}\n\nenum ListStatus {\n  WATCHING\n  PLAN_TO_WATCH\n  COMPLETED\n  DROPPED\n}\n\nmodel User {\n  id           String   @id @default(cuid())\n  username     String\n  email        String?  @unique\n  passwordHash String?\n  googleId     String?  @unique\n  tokenHash    String?  @unique\n  isAdmin      Boolean  @default(false)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  progress      WatchProgress[]\n  watchlist     Watchlist[]\n  searchHistory SearchHistory[]\n  pushTokens    PushToken[]\n  notifPrefs    NotificationPrefs?\n}\n\nmodel Anime {\n  id           String       @id @default(cuid())\n  externalId   String?      @unique\n  title        String\n  englishTitle String?\n  nativeTitle  String?\n  synonyms     String[]     @default([])\n  description  String       @default("")\n  coverImage   String?\n  bannerImage  String?\n  year         Int?\n  month        Int?\n  season       AnimeSeason?\n  status       AnimeStatus  @default(FINISHED)\n  type         AnimeType    @default(TV)\n  rating       Float?\n  popularity   Int          @default(0)\n  duration     Int?\n  episodeCount Int?\n  studio       String?\n  startDate    DateTime?\n  createdAt    DateTime     @default(now())\n  updatedAt    DateTime     @updatedAt\n\n  genres    AnimeGenre[]\n  seasons   Season[]\n  episodes  Episode[]\n  progress  WatchProgress[]\n  watchlist Watchlist[]\n\n  @@index([title])\n  @@index([year])\n  @@index([season])\n  @@index([status])\n  @@index([type])\n  @@index([rating])\n  @@index([popularity])\n  @@index([startDate])\n  @@index([createdAt])\n  @@index([updatedAt])\n  @@index([year, season])\n}\n\nmodel Genre {\n  id    Int          @id @default(autoincrement())\n  name  String       @unique\n  anime AnimeGenre[]\n}\n\nmodel AnimeGenre {\n  animeId String\n  genreId Int\n  anime   Anime  @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  genre   Genre  @relation(fields: [genreId], references: [id], onDelete: Cascade)\n\n  @@id([animeId, genreId])\n  @@index([genreId])\n}\n\nmodel Season {\n  id       String    @id @default(cuid())\n  animeId  String\n  number   Int\n  title    String\n  anime    Anime     @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  episodes Episode[]\n\n  @@unique([animeId, number])\n}\n\nmodel Episode {\n  id            String    @id @default(cuid())\n  animeId       String\n  seasonId      String?\n  episodeNumber Int\n  title         String\n  description   String    @default("")\n  thumbnail     String?\n  releaseDate   DateTime?\n  duration      Int?\n  createdAt     DateTime  @default(now())\n\n  anime     Anime           @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  season    Season?         @relation(fields: [seasonId], references: [id], onDelete: SetNull)\n  subtitles Subtitle[]\n  sources   MediaSource[]\n  progress  WatchProgress[]\n\n  @@unique([animeId, seasonId, episodeNumber])\n  @@index([releaseDate])\n  @@index([animeId])\n  @@index([createdAt])\n}\n\nmodel Subtitle {\n  id        String  @id @default(cuid())\n  episodeId String\n  language  String\n  label     String\n  url       String\n  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)\n\n  @@index([episodeId])\n}\n\n// Media sources the owner has added manually and has rights to use.\nmodel MediaSource {\n  id        String   @id @default(cuid())\n  episodeId String\n  url       String\n  quality   String   @default("auto")\n  mimeType  String?\n  note      String?\n  createdAt DateTime @default(now())\n  episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)\n\n  @@index([episodeId])\n}\n\nmodel WatchProgress {\n  id              String   @id @default(cuid())\n  userId          String\n  animeId         String\n  episodeId       String\n  progressSeconds Int      @default(0)\n  durationSeconds Int      @default(0)\n  completed       Boolean  @default(false)\n  updatedAt       DateTime @updatedAt\n\n  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  anime   Anime   @relation(fields: [animeId], references: [id], onDelete: Cascade)\n  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, episodeId])\n  @@index([userId, updatedAt])\n}\n\nmodel Watchlist {\n  id        String     @id @default(cuid())\n  userId    String\n  animeId   String\n  status    ListStatus @default(PLAN_TO_WATCH)\n  createdAt DateTime   @default(now())\n  updatedAt DateTime   @updatedAt\n\n  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)\n  anime Anime @relation(fields: [animeId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, animeId])\n  @@index([userId, status])\n}\n\nmodel SearchHistory {\n  id        String   @id @default(cuid())\n  userId    String\n  query     String\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, query])\n  @@index([userId, createdAt])\n}\n\nmodel PushToken {\n  id        String   @id @default(cuid())\n  userId    String\n  token     String   @unique\n  platform  String\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n}\n\nmodel NotificationPrefs {\n  userId          String  @id\n  newEpisodes     Boolean @default(true)\n  newAnime        Boolean @default(false)\n  recommendations Boolean @default(false)\n  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n}\n\nmodel SyncRun {\n  id            String    @id @default(cuid())\n  provider      String\n  startedAt     DateTime  @default(now())\n  finishedAt    DateTime?\n  animeAdded    Int       @default(0)\n  animeUpdated  Int       @default(0)\n  episodesAdded Int       @default(0)\n  errors        String[]  @default([])\n\n  @@index([startedAt])\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"username","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"googleId","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"isAdmin","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"progress","kind":"object","type":"WatchProgress","relationName":"UserToWatchProgress"},{"name":"watchlist","kind":"object","type":"Watchlist","relationName":"UserToWatchlist"},{"name":"searchHistory","kind":"object","type":"SearchHistory","relationName":"SearchHistoryToUser"},{"name":"pushTokens","kind":"object","type":"PushToken","relationName":"PushTokenToUser"},{"name":"notifPrefs","kind":"object","type":"NotificationPrefs","relationName":"NotificationPrefsToUser"}],"dbName":null,"schema":null},"Anime":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"externalId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"englishTitle","kind":"scalar","type":"String"},{"name":"nativeTitle","kind":"scalar","type":"String"},{"name":"synonyms","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"bannerImage","kind":"scalar","type":"String"},{"name":"year","kind":"scalar","type":"Int"},{"name":"month","kind":"scalar","type":"Int"},{"name":"season","kind":"enum","type":"AnimeSeason"},{"name":"status","kind":"enum","type":"AnimeStatus"},{"name":"type","kind":"enum","type":"AnimeType"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"popularity","kind":"scalar","type":"Int"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"episodeCount","kind":"scalar","type":"Int"},{"name":"studio","kind":"scalar","type":"String"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"genres","kind":"object","type":"AnimeGenre","relationName":"AnimeToAnimeGenre"},{"name":"seasons","kind":"object","type":"Season","relationName":"AnimeToSeason"},{"name":"episodes","kind":"object","type":"Episode","relationName":"AnimeToEpisode"},{"name":"progress","kind":"object","type":"WatchProgress","relationName":"AnimeToWatchProgress"},{"name":"watchlist","kind":"object","type":"Watchlist","relationName":"AnimeToWatchlist"}],"dbName":null,"schema":null},"Genre":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"name","kind":"scalar","type":"String"},{"name":"anime","kind":"object","type":"AnimeGenre","relationName":"AnimeGenreToGenre"}],"dbName":null,"schema":null},"AnimeGenre":{"fields":[{"name":"animeId","kind":"scalar","type":"String"},{"name":"genreId","kind":"scalar","type":"Int"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToAnimeGenre"},{"name":"genre","kind":"object","type":"Genre","relationName":"AnimeGenreToGenre"}],"dbName":null,"schema":null},"Season":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"number","kind":"scalar","type":"Int"},{"name":"title","kind":"scalar","type":"String"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToSeason"},{"name":"episodes","kind":"object","type":"Episode","relationName":"EpisodeToSeason"}],"dbName":null,"schema":null},"Episode":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"seasonId","kind":"scalar","type":"String"},{"name":"episodeNumber","kind":"scalar","type":"Int"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"thumbnail","kind":"scalar","type":"String"},{"name":"releaseDate","kind":"scalar","type":"DateTime"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToEpisode"},{"name":"season","kind":"object","type":"Season","relationName":"EpisodeToSeason"},{"name":"subtitles","kind":"object","type":"Subtitle","relationName":"EpisodeToSubtitle"},{"name":"sources","kind":"object","type":"MediaSource","relationName":"EpisodeToMediaSource"},{"name":"progress","kind":"object","type":"WatchProgress","relationName":"EpisodeToWatchProgress"}],"dbName":null,"schema":null},"Subtitle":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"episodeId","kind":"scalar","type":"String"},{"name":"language","kind":"scalar","type":"String"},{"name":"label","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"episode","kind":"object","type":"Episode","relationName":"EpisodeToSubtitle"}],"dbName":null,"schema":null},"MediaSource":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"episodeId","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"quality","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"note","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"episode","kind":"object","type":"Episode","relationName":"EpisodeToMediaSource"}],"dbName":null,"schema":null},"WatchProgress":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"episodeId","kind":"scalar","type":"String"},{"name":"progressSeconds","kind":"scalar","type":"Int"},{"name":"durationSeconds","kind":"scalar","type":"Int"},{"name":"completed","kind":"scalar","type":"Boolean"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserToWatchProgress"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToWatchProgress"},{"name":"episode","kind":"object","type":"Episode","relationName":"EpisodeToWatchProgress"}],"dbName":null,"schema":null},"Watchlist":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"animeId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ListStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserToWatchlist"},{"name":"anime","kind":"object","type":"Anime","relationName":"AnimeToWatchlist"}],"dbName":null,"schema":null},"SearchHistory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"query","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SearchHistoryToUser"}],"dbName":null,"schema":null},"PushToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"token","kind":"scalar","type":"String"},{"name":"platform","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PushTokenToUser"}],"dbName":null,"schema":null},"NotificationPrefs":{"fields":[{"name":"userId","kind":"scalar","type":"String"},{"name":"newEpisodes","kind":"scalar","type":"Boolean"},{"name":"newAnime","kind":"scalar","type":"Boolean"},{"name":"recommendations","kind":"scalar","type":"Boolean"},{"name":"user","kind":"object","type":"User","relationName":"NotificationPrefsToUser"}],"dbName":null,"schema":null},"SyncRun":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"provider","kind":"scalar","type":"String"},{"name":"startedAt","kind":"scalar","type":"DateTime"},{"name":"finishedAt","kind":"scalar","type":"DateTime"},{"name":"animeAdded","kind":"scalar","type":"Int"},{"name":"animeUpdated","kind":"scalar","type":"Int"},{"name":"episodesAdded","kind":"scalar","type":"Int"},{"name":"errors","kind":"scalar","type":"String"}],"dbName":null,"schema":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","anime","_count","genre","genres","season","episode","subtitles","sources","progress","episodes","seasons","watchlist","searchHistory","pushTokens","notifPrefs","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Anime.findUnique","Anime.findUniqueOrThrow","Anime.findFirst","Anime.findFirstOrThrow","Anime.findMany","Anime.createOne","Anime.createMany","Anime.createManyAndReturn","Anime.updateOne","Anime.updateMany","Anime.updateManyAndReturn","Anime.upsertOne","Anime.deleteOne","Anime.deleteMany","_avg","_sum","Anime.groupBy","Anime.aggregate","Genre.findUnique","Genre.findUniqueOrThrow","Genre.findFirst","Genre.findFirstOrThrow","Genre.findMany","Genre.createOne","Genre.createMany","Genre.createManyAndReturn","Genre.updateOne","Genre.updateMany","Genre.updateManyAndReturn","Genre.upsertOne","Genre.deleteOne","Genre.deleteMany","Genre.groupBy","Genre.aggregate","AnimeGenre.findUnique","AnimeGenre.findUniqueOrThrow","AnimeGenre.findFirst","AnimeGenre.findFirstOrThrow","AnimeGenre.findMany","AnimeGenre.createOne","AnimeGenre.createMany","AnimeGenre.createManyAndReturn","AnimeGenre.updateOne","AnimeGenre.updateMany","AnimeGenre.updateManyAndReturn","AnimeGenre.upsertOne","AnimeGenre.deleteOne","AnimeGenre.deleteMany","AnimeGenre.groupBy","AnimeGenre.aggregate","Season.findUnique","Season.findUniqueOrThrow","Season.findFirst","Season.findFirstOrThrow","Season.findMany","Season.createOne","Season.createMany","Season.createManyAndReturn","Season.updateOne","Season.updateMany","Season.updateManyAndReturn","Season.upsertOne","Season.deleteOne","Season.deleteMany","Season.groupBy","Season.aggregate","Episode.findUnique","Episode.findUniqueOrThrow","Episode.findFirst","Episode.findFirstOrThrow","Episode.findMany","Episode.createOne","Episode.createMany","Episode.createManyAndReturn","Episode.updateOne","Episode.updateMany","Episode.updateManyAndReturn","Episode.upsertOne","Episode.deleteOne","Episode.deleteMany","Episode.groupBy","Episode.aggregate","Subtitle.findUnique","Subtitle.findUniqueOrThrow","Subtitle.findFirst","Subtitle.findFirstOrThrow","Subtitle.findMany","Subtitle.createOne","Subtitle.createMany","Subtitle.createManyAndReturn","Subtitle.updateOne","Subtitle.updateMany","Subtitle.updateManyAndReturn","Subtitle.upsertOne","Subtitle.deleteOne","Subtitle.deleteMany","Subtitle.groupBy","Subtitle.aggregate","MediaSource.findUnique","MediaSource.findUniqueOrThrow","MediaSource.findFirst","MediaSource.findFirstOrThrow","MediaSource.findMany","MediaSource.createOne","MediaSource.createMany","MediaSource.createManyAndReturn","MediaSource.updateOne","MediaSource.updateMany","MediaSource.updateManyAndReturn","MediaSource.upsertOne","MediaSource.deleteOne","MediaSource.deleteMany","MediaSource.groupBy","MediaSource.aggregate","WatchProgress.findUnique","WatchProgress.findUniqueOrThrow","WatchProgress.findFirst","WatchProgress.findFirstOrThrow","WatchProgress.findMany","WatchProgress.createOne","WatchProgress.createMany","WatchProgress.createManyAndReturn","WatchProgress.updateOne","WatchProgress.updateMany","WatchProgress.updateManyAndReturn","WatchProgress.upsertOne","WatchProgress.deleteOne","WatchProgress.deleteMany","WatchProgress.groupBy","WatchProgress.aggregate","Watchlist.findUnique","Watchlist.findUniqueOrThrow","Watchlist.findFirst","Watchlist.findFirstOrThrow","Watchlist.findMany","Watchlist.createOne","Watchlist.createMany","Watchlist.createManyAndReturn","Watchlist.updateOne","Watchlist.updateMany","Watchlist.updateManyAndReturn","Watchlist.upsertOne","Watchlist.deleteOne","Watchlist.deleteMany","Watchlist.groupBy","Watchlist.aggregate","SearchHistory.findUnique","SearchHistory.findUniqueOrThrow","SearchHistory.findFirst","SearchHistory.findFirstOrThrow","SearchHistory.findMany","SearchHistory.createOne","SearchHistory.createMany","SearchHistory.createManyAndReturn","SearchHistory.updateOne","SearchHistory.updateMany","SearchHistory.updateManyAndReturn","SearchHistory.upsertOne","SearchHistory.deleteOne","SearchHistory.deleteMany","SearchHistory.groupBy","SearchHistory.aggregate","PushToken.findUnique","PushToken.findUniqueOrThrow","PushToken.findFirst","PushToken.findFirstOrThrow","PushToken.findMany","PushToken.createOne","PushToken.createMany","PushToken.createManyAndReturn","PushToken.updateOne","PushToken.updateMany","PushToken.updateManyAndReturn","PushToken.upsertOne","PushToken.deleteOne","PushToken.deleteMany","PushToken.groupBy","PushToken.aggregate","NotificationPrefs.findUnique","NotificationPrefs.findUniqueOrThrow","NotificationPrefs.findFirst","NotificationPrefs.findFirstOrThrow","NotificationPrefs.findMany","NotificationPrefs.createOne","NotificationPrefs.createMany","NotificationPrefs.createManyAndReturn","NotificationPrefs.updateOne","NotificationPrefs.updateMany","NotificationPrefs.updateManyAndReturn","NotificationPrefs.upsertOne","NotificationPrefs.deleteOne","NotificationPrefs.deleteMany","NotificationPrefs.groupBy","NotificationPrefs.aggregate","SyncRun.findUnique","SyncRun.findUniqueOrThrow","SyncRun.findFirst","SyncRun.findFirstOrThrow","SyncRun.findMany","SyncRun.createOne","SyncRun.createMany","SyncRun.createManyAndReturn","SyncRun.updateOne","SyncRun.updateMany","SyncRun.updateManyAndReturn","SyncRun.upsertOne","SyncRun.deleteOne","SyncRun.deleteMany","SyncRun.groupBy","SyncRun.aggregate","AND","OR","NOT","id","provider","startedAt","finishedAt","animeAdded","animeUpdated","episodesAdded","errors","equals","has","hasEvery","hasSome","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","userId","newEpisodes","newAnime","recommendations","token","platform","createdAt","query","animeId","ListStatus","status","updatedAt","episodeId","progressSeconds","durationSeconds","completed","url","quality","mimeType","note","language","label","seasonId","episodeNumber","title","description","thumbnail","releaseDate","duration","number","genreId","name","every","some","none","externalId","englishTitle","nativeTitle","synonyms","coverImage","bannerImage","year","month","AnimeSeason","AnimeStatus","AnimeType","type","rating","popularity","episodeCount","studio","startDate","username","email","passwordHash","googleId","tokenHash","isAdmin","userId_query","userId_animeId","animeId_seasonId_episodeNumber","animeId_number","animeId_genreId","userId_episodeId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide","push"]'),
  graph: "7AaEAeABEQwAAMUDACAPAADGAwAgEAAAyQMAIBEAAMoDACASAADLAwAg-wEAAMgDADD8AQAAPgAQ_QEAAMgDADD-AQEAAAABmgJAAJEDACGfAkAAkQMAIcgCAQCQAwAhyQIBAAAAAcoCAQC9AwAhywIBAAAAAcwCAQAAAAHNAiAAmQMAIQEAAAABACAOAwAAmgMAIAQAANIDACAJAADUAwAg-wEAAOEDADD8AQAAAwAQ_QEAAOEDADD-AQEAkAMAIZQCAQCQAwAhnAIBAJADACGfAkAAkQMAIaACAQCQAwAhoQICAJMDACGiAgIAkwMAIaMCIACZAwAhAwMAAPQDACAEAACOBgAgCQAAjwYAIA8DAACaAwAgBAAA0gMAIAkAANQDACD7AQAA4QMAMPwBAAADABD9AQAA4QMAMP4BAQAAAAGUAgEAkAMAIZwCAQCQAwAhnwJAAJEDACGgAgEAkAMAIaECAgCTAwAhogICAJMDACGjAiAAmQMAIdMCAADgAwAgAwAAAAMAIAEAAAQAMAIAAAUAIAcEAADSAwAgBgAA3wMAIPsBAADeAwAw_AEAAAcAEP0BAADeAwAwnAIBAJADACGyAgIAkwMAIQIEAACOBgAgBgAAkwYAIAgEAADSAwAgBgAA3wMAIPsBAADeAwAw_AEAAAcAEP0BAADeAwAwnAIBAJADACGyAgIAkwMAIdICAADdAwAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACABAAAABwAgCQQAANIDACANAADEAwAg-wEAANwDADD8AQAADQAQ_QEAANwDADD-AQEAkAMAIZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIQIEAACOBgAgDQAAzAUAIAoEAADSAwAgDQAAxAMAIPsBAADcAwAw_AEAAA0AEP0BAADcAwAw_gEBAAAAAZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIdECAADbAwAgAwAAAA0AIAEAAA4AMAIAAA8AIBIEAADSAwAgCAAA2AMAIAoAANkDACALAADaAwAgDAAAxQMAIPsBAADXAwAw_AEAABEAEP0BAADXAwAw_gEBAJADACGaAkAAkQMAIZwCAQCQAwAhqgIBAL0DACGrAgIAkwMAIawCAQCQAwAhrQIBAJADACGuAgEAvQMAIa8CQACSAwAhsAICAL4DACEJBAAAjgYAIAgAAJAGACAKAACRBgAgCwAAkgYAIAwAAM0FACCqAgAA4gMAIK4CAADiAwAgrwIAAOIDACCwAgAA4gMAIBMEAADSAwAgCAAA2AMAIAoAANkDACALAADaAwAgDAAAxQMAIPsBAADXAwAw_AEAABEAEP0BAADXAwAw_gEBAAAAAZoCQACRAwAhnAIBAJADACGqAgEAvQMAIasCAgCTAwAhrAIBAJADACGtAgEAkAMAIa4CAQC9AwAhrwJAAJIDACGwAgIAvgMAIdACAADWAwAgAwAAABEAIAEAABIAMAIAABMAIAEAAAANACAJCQAA1AMAIPsBAADVAwAw_AEAABYAEP0BAADVAwAw_gEBAJADACGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQEJAACPBgAgCQkAANQDACD7AQAA1QMAMPwBAAAWABD9AQAA1QMAMP4BAQAAAAGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQMAAAAWACABAAAXADACAAAYACALCQAA1AMAIPsBAADTAwAw_AEAABoAEP0BAADTAwAw_gEBAJADACGaAkAAkQMAIaACAQCQAwAhpAIBAJADACGlAgEAkAMAIaYCAQC9AwAhpwIBAL0DACEDCQAAjwYAIKYCAADiAwAgpwIAAOIDACALCQAA1AMAIPsBAADTAwAw_AEAABoAEP0BAADTAwAw_gEBAAAAAZoCQACRAwAhoAIBAJADACGkAgEAkAMAIaUCAQCQAwAhpgIBAL0DACGnAgEAvQMAIQMAAAAaACABAAAbADACAAAcACADAAAAAwAgAQAABAAwAgAABQAgAQAAABYAIAEAAAAaACABAAAAAwAgAQAAABEAIAMAAAARACABAAASADACAAATACADAAAAAwAgAQAABAAwAgAABQAgCwMAAJoDACAEAADSAwAg-wEAANADADD8AQAAJQAQ_QEAANADADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGcAgEAkAMAIZ4CAADRA54CIp8CQACRAwAhAgMAAPQDACAEAACOBgAgDAMAAJoDACAEAADSAwAg-wEAANADADD8AQAAJQAQ_QEAANADADD-AQEAAAABlAIBAJADACGaAkAAkQMAIZwCAQCQAwAhngIAANEDngIinwJAAJEDACHPAgAAzwMAIAMAAAAlACABAAAmADACAAAnACABAAAABwAgAQAAAA0AIAEAAAARACABAAAAAwAgAQAAACUAIAMAAAAlACABAAAmADACAAAnACAIAwAAmgMAIPsBAADOAwAw_AEAAC8AEP0BAADOAwAw_gEBAJADACGUAgEAkAMAIZoCQACRAwAhmwIBAJADACEBAwAA9AMAIAkDAACaAwAg-wEAAM4DADD8AQAALwAQ_QEAAM4DADD-AQEAAAABlAIBAJADACGaAkAAkQMAIZsCAQCQAwAhzgIAAM0DACADAAAALwAgAQAAMAAwAgAAMQAgCQMAAJoDACD7AQAAzAMAMPwBAAAzABD9AQAAzAMAMP4BAQCQAwAhlAIBAJADACGYAgEAkAMAIZkCAQCQAwAhmgJAAJEDACEBAwAA9AMAIAkDAACaAwAg-wEAAMwDADD8AQAAMwAQ_QEAAMwDADD-AQEAAAABlAIBAJADACGYAgEAAAABmQIBAJADACGaAkAAkQMAIQMAAAAzACABAAA0ADACAAA1ACAIAwAAmgMAIPsBAACYAwAw_AEAADcAEP0BAACYAwAwlAIBAJADACGVAiAAmQMAIZYCIACZAwAhlwIgAJkDACEBAAAANwAgAQAAAAMAIAEAAAAlACABAAAALwAgAQAAADMAIAEAAAABACARDAAAxQMAIA8AAMYDACAQAADJAwAgEQAAygMAIBIAAMsDACD7AQAAyAMAMPwBAAA-ABD9AQAAyAMAMP4BAQCQAwAhmgJAAJEDACGfAkAAkQMAIcgCAQCQAwAhyQIBAL0DACHKAgEAvQMAIcsCAQC9AwAhzAIBAL0DACHNAiAAmQMAIQkMAADNBQAgDwAAzgUAIBAAAIsGACARAACMBgAgEgAAjQYAIMkCAADiAwAgygIAAOIDACDLAgAA4gMAIMwCAADiAwAgAwAAAD4AIAEAAD8AMAIAAAEAIAMAAAA-ACABAAA_ADACAAABACADAAAAPgAgAQAAPwAwAgAAAQAgDgwAAIYGACAPAACHBgAgEAAAiAYAIBEAAIkGACASAACKBgAg_gEBAAAAAZoCQAAAAAGfAkAAAAAByAIBAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAiAAAAABARgAAEMAIAn-AQEAAAABmgJAAAAAAZ8CQAAAAAHIAgEAAAAByQIBAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAc0CIAAAAAEBGAAARQAwARgAAEUAMA4MAADSBQAgDwAA0wUAIBAAANQFACARAADVBQAgEgAA1gUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIcgCAQDoAwAhyQIBAJUEACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAiAA8QMAIQIAAAABACAYAABIACAJ_gEBAOgDACGaAkAA6QMAIZ8CQADpAwAhyAIBAOgDACHJAgEAlQQAIcoCAQCVBAAhywIBAJUEACHMAgEAlQQAIc0CIADxAwAhAgAAAD4AIBgAAEoAIAIAAAA-ACAYAABKACADAAAAAQAgHwAAQwAgIAAASAAgAQAAAAEAIAEAAAA-ACAHBQAAzwUAICUAANEFACAmAADQBQAgyQIAAOIDACDKAgAA4gMAIMsCAADiAwAgzAIAAOIDACAM-wEAAMcDADD8AQAAUQAQ_QEAAMcDADD-AQEAgAMAIZoCQACBAwAhnwJAAIEDACHIAgEAgAMAIckCAQCjAwAhygIBAKMDACHLAgEAowMAIcwCAQCjAwAhzQIgAJUDACEDAAAAPgAgAQAAUAAwJAAAUQAgAwAAAD4AIAEAAD8AMAIAAAEAIB4HAACvAwAgCAAAvwPAAiMMAADFAwAgDQAAxAMAIA4AAMMDACAPAADGAwAg-wEAALwDADD8AQAAVwAQ_QEAALwDADD-AQEAAAABmgJAAJEDACGeAgAAwAPBAiKfAkAAkQMAIawCAQCQAwAhrQIBAJADACGwAgIAvgMAIbcCAQAAAAG4AgEAvQMAIbkCAQC9AwAhugIAAIQDACC7AgEAvQMAIbwCAQC9AwAhvQICAL4DACG-AgIAvgMAIcICAADBA8ICIsMCCADCAwAhxAICAJMDACHFAgIAvgMAIcYCAQC9AwAhxwJAAJIDACEBAAAAVAAgAQAAAFQAIB4HAACvAwAgCAAAvwPAAiMMAADFAwAgDQAAxAMAIA4AAMMDACAPAADGAwAg-wEAALwDADD8AQAAVwAQ_QEAALwDADD-AQEAkAMAIZoCQACRAwAhngIAAMADwQIinwJAAJEDACGsAgEAkAMAIa0CAQCQAwAhsAICAL4DACG3AgEAvQMAIbgCAQC9AwAhuQIBAL0DACG6AgAAhAMAILsCAQC9AwAhvAIBAL0DACG9AgIAvgMAIb4CAgC-AwAhwgIAAMEDwgIiwwIIAMIDACHEAgIAkwMAIcUCAgC-AwAhxgIBAL0DACHHAkAAkgMAIRIHAACCBQAgCAAA4gMAIAwAAM0FACANAADMBQAgDgAAywUAIA8AAM4FACCwAgAA4gMAILcCAADiAwAguAIAAOIDACC5AgAA4gMAILsCAADiAwAgvAIAAOIDACC9AgAA4gMAIL4CAADiAwAgwwIAAOIDACDFAgAA4gMAIMYCAADiAwAgxwIAAOIDACADAAAAVwAgAQAAWAAwAgAAVAAgAwAAAFcAIAEAAFgAMAIAAFQAIAMAAABXACABAABYADACAABUACAbBwAAxgUAIAgAAADAAgMMAADJBQAgDQAAyAUAIA4AAMcFACAPAADKBQAg_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAABARgAAFwAIBYIAAAAwAID_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAABARgAAF4AMAEYAABeADAbBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA0AAI8FACAOAACOBQAgDwAAkQUAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhAgAAAFQAIBgAAGEAIBYIAACJBcACI_4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhAgAAAFcAIBgAAGMAIAIAAABXACAYAABjACADAAAAVAAgHwAAXAAgIAAAYQAgAQAAAFQAIAEAAABXACASBQAAgwUAIAgAAOIDACAlAACGBQAgJgAAhQUAIDcAAIQFACA4AACHBQAgsAIAAOIDACC3AgAA4gMAILgCAADiAwAguQIAAOIDACC7AgAA4gMAILwCAADiAwAgvQIAAOIDACC-AgAA4gMAIMMCAADiAwAgxQIAAOIDACDGAgAA4gMAIMcCAADiAwAgGQgAALEDwAIj-wEAALADADD8AQAAagAQ_QEAALADADD-AQEAgAMAIZoCQACBAwAhngIAALIDwQIinwJAAIEDACGsAgEAgAMAIa0CAQCAAwAhsAICAKgDACG3AgEAowMAIbgCAQCjAwAhuQIBAKMDACG6AgAAhAMAILsCAQCjAwAhvAIBAKMDACG9AgIAqAMAIb4CAgCoAwAhwgIAALMDwgIiwwIIALQDACHEAgIAgwMAIcUCAgCoAwAhxgIBAKMDACHHAkAAggMAIQMAAABXACABAABpADAkAABqACADAAAAVwAgAQAAWAAwAgAAVAAgBgQAAK8DACD7AQAArgMAMPwBAABwABD9AQAArgMAMP4BAgAAAAGzAgEAAAABAQAAAG0AIAEAAABtACAGBAAArwMAIPsBAACuAwAw_AEAAHAAEP0BAACuAwAw_gECAJMDACGzAgEAkAMAIQEEAACCBQAgAwAAAHAAIAEAAHEAMAIAAG0AIAMAAABwACABAABxADACAABtACADAAAAcAAgAQAAcQAwAgAAbQAgAwQAAIEFACD-AQIAAAABswIBAAAAAQEYAAB1ACAC_gECAAAAAbMCAQAAAAEBGAAAdwAwARgAAHcAMAMEAAD0BAAg_gECAOsDACGzAgEA6AMAIQIAAABtACAYAAB6ACAC_gECAOsDACGzAgEA6AMAIQIAAABwACAYAAB8ACACAAAAcAAgGAAAfAAgAwAAAG0AIB8AAHUAICAAAHoAIAEAAABtACABAAAAcAAgBQUAAO8EACAlAADyBAAgJgAA8QQAIDcAAPAEACA4AADzBAAgBfsBAACtAwAw_AEAAIMBABD9AQAArQMAMP4BAgCDAwAhswIBAIADACEDAAAAcAAgAQAAggEAMCQAAIMBACADAAAAcAAgAQAAcQAwAgAAbQAgAQAAAAkAIAEAAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACAEBAAA7QQAIAYAAO4EACCcAgEAAAABsgICAAAAAQEYAACLAQAgApwCAQAAAAGyAgIAAAABARgAAI0BADABGAAAjQEAMAQEAADrBAAgBgAA7AQAIJwCAQDoAwAhsgICAOsDACECAAAACQAgGAAAkAEAIAKcAgEA6AMAIbICAgDrAwAhAgAAAAcAIBgAAJIBACACAAAABwAgGAAAkgEAIAMAAAAJACAfAACLAQAgIAAAkAEAIAEAAAAJACABAAAABwAgBQUAAOYEACAlAADpBAAgJgAA6AQAIDcAAOcEACA4AADqBAAgBfsBAACsAwAw_AEAAJkBABD9AQAArAMAMJwCAQCAAwAhsgICAIMDACEDAAAABwAgAQAAmAEAMCQAAJkBACADAAAABwAgAQAACAAwAgAACQAgAQAAAA8AIAEAAAAPACADAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIAMAAAANACABAAAOADACAAAPACAGBAAA5AQAIA0AAOUEACD-AQEAAAABnAIBAAAAAawCAQAAAAGxAgIAAAABARgAAKEBACAE_gEBAAAAAZwCAQAAAAGsAgEAAAABsQICAAAAAQEYAACjAQAwARgAAKMBADAGBAAA1gQAIA0AANcEACD-AQEA6AMAIZwCAQDoAwAhrAIBAOgDACGxAgIA6wMAIQIAAAAPACAYAACmAQAgBP4BAQDoAwAhnAIBAOgDACGsAgEA6AMAIbECAgDrAwAhAgAAAA0AIBgAAKgBACACAAAADQAgGAAAqAEAIAMAAAAPACAfAAChAQAgIAAApgEAIAEAAAAPACABAAAADQAgBQUAANEEACAlAADUBAAgJgAA0wQAIDcAANIEACA4AADVBAAgB_sBAACrAwAw_AEAAK8BABD9AQAAqwMAMP4BAQCAAwAhnAIBAIADACGsAgEAgAMAIbECAgCDAwAhAwAAAA0AIAEAAK4BADAkAACvAQAgAwAAAA0AIAEAAA4AMAIAAA8AIAEAAAATACABAAAAEwAgAwAAABEAIAEAABIAMAIAABMAIAMAAAARACABAAASADACAAATACADAAAAEQAgAQAAEgAwAgAAEwAgDwQAAMwEACAIAADNBAAgCgAAzgQAIAsAAM8EACAMAADQBAAg_gEBAAAAAZoCQAAAAAGcAgEAAAABqgIBAAAAAasCAgAAAAGsAgEAAAABrQIBAAAAAa4CAQAAAAGvAkAAAAABsAICAAAAAQEYAAC3AQAgCv4BAQAAAAGaAkAAAAABnAIBAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEBGAAAuQEAMAEYAAC5AQAwAQAAAA0AIA8EAACjBAAgCAAApAQAIAoAAKUEACALAACmBAAgDAAApwQAIP4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIaoCAQCVBAAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhAgAAABMAIBgAAL0BACAK_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACECAAAAEQAgGAAAvwEAIAIAAAARACAYAAC_AQAgAQAAAA0AIAMAAAATACAfAAC3AQAgIAAAvQEAIAEAAAATACABAAAAEQAgCQUAAJ0EACAlAACgBAAgJgAAnwQAIDcAAJ4EACA4AAChBAAgqgIAAOIDACCuAgAA4gMAIK8CAADiAwAgsAIAAOIDACAN-wEAAKcDADD8AQAAxwEAEP0BAACnAwAw_gEBAIADACGaAkAAgQMAIZwCAQCAAwAhqgIBAKMDACGrAgIAgwMAIawCAQCAAwAhrQIBAIADACGuAgEAowMAIa8CQACCAwAhsAICAKgDACEDAAAAEQAgAQAAxgEAMCQAAMcBACADAAAAEQAgAQAAEgAwAgAAEwAgAQAAABgAIAEAAAAYACADAAAAFgAgAQAAFwAwAgAAGAAgAwAAABYAIAEAABcAMAIAABgAIAMAAAAWACABAAAXADACAAAYACAGCQAAnAQAIP4BAQAAAAGgAgEAAAABpAIBAAAAAagCAQAAAAGpAgEAAAABARgAAM8BACAF_gEBAAAAAaACAQAAAAGkAgEAAAABqAIBAAAAAakCAQAAAAEBGAAA0QEAMAEYAADRAQAwBgkAAJsEACD-AQEA6AMAIaACAQDoAwAhpAIBAOgDACGoAgEA6AMAIakCAQDoAwAhAgAAABgAIBgAANQBACAF_gEBAOgDACGgAgEA6AMAIaQCAQDoAwAhqAIBAOgDACGpAgEA6AMAIQIAAAAWACAYAADWAQAgAgAAABYAIBgAANYBACADAAAAGAAgHwAAzwEAICAAANQBACABAAAAGAAgAQAAABYAIAMFAACYBAAgJQAAmgQAICYAAJkEACAI-wEAAKYDADD8AQAA3QEAEP0BAACmAwAw_gEBAIADACGgAgEAgAMAIaQCAQCAAwAhqAIBAIADACGpAgEAgAMAIQMAAAAWACABAADcAQAwJAAA3QEAIAMAAAAWACABAAAXADACAAAYACABAAAAHAAgAQAAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAgJAACXBAAg_gEBAAAAAZoCQAAAAAGgAgEAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAQEYAADlAQAgB_4BAQAAAAGaAkAAAAABoAIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAEBGAAA5wEAMAEYAADnAQAwCAkAAJYEACD-AQEA6AMAIZoCQADpAwAhoAIBAOgDACGkAgEA6AMAIaUCAQDoAwAhpgIBAJUEACGnAgEAlQQAIQIAAAAcACAYAADqAQAgB_4BAQDoAwAhmgJAAOkDACGgAgEA6AMAIaQCAQDoAwAhpQIBAOgDACGmAgEAlQQAIacCAQCVBAAhAgAAABoAIBgAAOwBACACAAAAGgAgGAAA7AEAIAMAAAAcACAfAADlAQAgIAAA6gEAIAEAAAAcACABAAAAGgAgBQUAAJIEACAlAACUBAAgJgAAkwQAIKYCAADiAwAgpwIAAOIDACAK-wEAAKIDADD8AQAA8wEAEP0BAACiAwAw_gEBAIADACGaAkAAgQMAIaACAQCAAwAhpAIBAIADACGlAgEAgAMAIaYCAQCjAwAhpwIBAKMDACEDAAAAGgAgAQAA8gEAMCQAAPMBACADAAAAGgAgAQAAGwAwAgAAHAAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACALAwAAjwQAIAQAAJAEACAJAACRBAAg_gEBAAAAAZQCAQAAAAGcAgEAAAABnwJAAAAAAaACAQAAAAGhAgIAAAABogICAAAAAaMCIAAAAAEBGAAA-wEAIAj-AQEAAAABlAIBAAAAAZwCAQAAAAGfAkAAAAABoAIBAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQEYAAD9AQAwARgAAP0BADALAwAAjAQAIAQAAI0EACAJAACOBAAg_gEBAOgDACGUAgEA6AMAIZwCAQDoAwAhnwJAAOkDACGgAgEA6AMAIaECAgDrAwAhogICAOsDACGjAiAA8QMAIQIAAAAFACAYAACAAgAgCP4BAQDoAwAhlAIBAOgDACGcAgEA6AMAIZ8CQADpAwAhoAIBAOgDACGhAgIA6wMAIaICAgDrAwAhowIgAPEDACECAAAAAwAgGAAAggIAIAIAAAADACAYAACCAgAgAwAAAAUAIB8AAPsBACAgAACAAgAgAQAAAAUAIAEAAAADACAFBQAAhwQAICUAAIoEACAmAACJBAAgNwAAiAQAIDgAAIsEACAL-wEAAKEDADD8AQAAiQIAEP0BAAChAwAw_gEBAIADACGUAgEAgAMAIZwCAQCAAwAhnwJAAIEDACGgAgEAgAMAIaECAgCDAwAhogICAIMDACGjAiAAlQMAIQMAAAADACABAACIAgAwJAAAiQIAIAMAAAADACABAAAEADACAAAFACABAAAAJwAgAQAAACcAIAMAAAAlACABAAAmADACAAAnACADAAAAJQAgAQAAJgAwAgAAJwAgAwAAACUAIAEAACYAMAIAACcAIAgDAACFBAAgBAAAhgQAIP4BAQAAAAGUAgEAAAABmgJAAAAAAZwCAQAAAAGeAgAAAJ4CAp8CQAAAAAEBGAAAkQIAIAb-AQEAAAABlAIBAAAAAZoCQAAAAAGcAgEAAAABngIAAACeAgKfAkAAAAABARgAAJMCADABGAAAkwIAMAgDAACDBAAgBAAAhAQAIP4BAQDoAwAhlAIBAOgDACGaAkAA6QMAIZwCAQDoAwAhngIAAIIEngIinwJAAOkDACECAAAAJwAgGAAAlgIAIAb-AQEA6AMAIZQCAQDoAwAhmgJAAOkDACGcAgEA6AMAIZ4CAACCBJ4CIp8CQADpAwAhAgAAACUAIBgAAJgCACACAAAAJQAgGAAAmAIAIAMAAAAnACAfAACRAgAgIAAAlgIAIAEAAAAnACABAAAAJQAgAwUAAP8DACAlAACBBAAgJgAAgAQAIAn7AQAAnQMAMPwBAACfAgAQ_QEAAJ0DADD-AQEAgAMAIZQCAQCAAwAhmgJAAIEDACGcAgEAgAMAIZ4CAACeA54CIp8CQACBAwAhAwAAACUAIAEAAJ4CADAkAACfAgAgAwAAACUAIAEAACYAMAIAACcAIAEAAAAxACABAAAAMQAgAwAAAC8AIAEAADAAMAIAADEAIAMAAAAvACABAAAwADACAAAxACADAAAALwAgAQAAMAAwAgAAMQAgBQMAAP4DACD-AQEAAAABlAIBAAAAAZoCQAAAAAGbAgEAAAABARgAAKcCACAE_gEBAAAAAZQCAQAAAAGaAkAAAAABmwIBAAAAAQEYAACpAgAwARgAAKkCADAFAwAA_QMAIP4BAQDoAwAhlAIBAOgDACGaAkAA6QMAIZsCAQDoAwAhAgAAADEAIBgAAKwCACAE_gEBAOgDACGUAgEA6AMAIZoCQADpAwAhmwIBAOgDACECAAAALwAgGAAArgIAIAIAAAAvACAYAACuAgAgAwAAADEAIB8AAKcCACAgAACsAgAgAQAAADEAIAEAAAAvACADBQAA-gMAICUAAPwDACAmAAD7AwAgB_sBAACcAwAw_AEAALUCABD9AQAAnAMAMP4BAQCAAwAhlAIBAIADACGaAkAAgQMAIZsCAQCAAwAhAwAAAC8AIAEAALQCADAkAAC1AgAgAwAAAC8AIAEAADAAMAIAADEAIAEAAAA1ACABAAAANQAgAwAAADMAIAEAADQAMAIAADUAIAMAAAAzACABAAA0ADACAAA1ACADAAAAMwAgAQAANAAwAgAANQAgBgMAAPkDACD-AQEAAAABlAIBAAAAAZgCAQAAAAGZAgEAAAABmgJAAAAAAQEYAAC9AgAgBf4BAQAAAAGUAgEAAAABmAIBAAAAAZkCAQAAAAGaAkAAAAABARgAAL8CADABGAAAvwIAMAYDAAD4AwAg_gEBAOgDACGUAgEA6AMAIZgCAQDoAwAhmQIBAOgDACGaAkAA6QMAIQIAAAA1ACAYAADCAgAgBf4BAQDoAwAhlAIBAOgDACGYAgEA6AMAIZkCAQDoAwAhmgJAAOkDACECAAAAMwAgGAAAxAIAIAIAAAAzACAYAADEAgAgAwAAADUAIB8AAL0CACAgAADCAgAgAQAAADUAIAEAAAAzACADBQAA9QMAICUAAPcDACAmAAD2AwAgCPsBAACbAwAw_AEAAMsCABD9AQAAmwMAMP4BAQCAAwAhlAIBAIADACGYAgEAgAMAIZkCAQCAAwAhmgJAAIEDACEDAAAAMwAgAQAAygIAMCQAAMsCACADAAAAMwAgAQAANAAwAgAANQAgCAMAAJoDACD7AQAAmAMAMPwBAAA3ABD9AQAAmAMAMJQCAQAAAAGVAiAAmQMAIZYCIACZAwAhlwIgAJkDACEBAAAAzgIAIAEAAADOAgAgAQMAAPQDACADAAAANwAgAQAA0QIAMAIAAM4CACADAAAANwAgAQAA0QIAMAIAAM4CACADAAAANwAgAQAA0QIAMAIAAM4CACAFAwAA8wMAIJQCAQAAAAGVAiAAAAABlgIgAAAAAZcCIAAAAAEBGAAA1QIAIASUAgEAAAABlQIgAAAAAZYCIAAAAAGXAiAAAAABARgAANcCADABGAAA1wIAMAUDAADyAwAglAIBAOgDACGVAiAA8QMAIZYCIADxAwAhlwIgAPEDACECAAAAzgIAIBgAANoCACAElAIBAOgDACGVAiAA8QMAIZYCIADxAwAhlwIgAPEDACECAAAANwAgGAAA3AIAIAIAAAA3ACAYAADcAgAgAwAAAM4CACAfAADVAgAgIAAA2gIAIAEAAADOAgAgAQAAADcAIAMFAADuAwAgJQAA8AMAICYAAO8DACAH-wEAAJQDADD8AQAA4wIAEP0BAACUAwAwlAIBAIADACGVAiAAlQMAIZYCIACVAwAhlwIgAJUDACEDAAAANwAgAQAA4gIAMCQAAOMCACADAAAANwAgAQAA0QIAMAIAAM4CACAL-wEAAI8DADD8AQAA6QIAEP0BAACPAwAw_gEBAAAAAf8BAQCQAwAhgAJAAJEDACGBAkAAkgMAIYICAgCTAwAhgwICAJMDACGEAgIAkwMAIYUCAACEAwAgAQAAAOYCACABAAAA5gIAIAv7AQAAjwMAMPwBAADpAgAQ_QEAAI8DADD-AQEAkAMAIf8BAQCQAwAhgAJAAJEDACGBAkAAkgMAIYICAgCTAwAhgwICAJMDACGEAgIAkwMAIYUCAACEAwAgAYECAADiAwAgAwAAAOkCACABAADqAgAwAgAA5gIAIAMAAADpAgAgAQAA6gIAMAIAAOYCACADAAAA6QIAIAEAAOoCADACAADmAgAgCP4BAQAAAAH_AQEAAAABgAJAAAAAAYECQAAAAAGCAgIAAAABgwICAAAAAYQCAgAAAAGFAgAA7QMAIAEYAADuAgAgCP4BAQAAAAH_AQEAAAABgAJAAAAAAYECQAAAAAGCAgIAAAABgwICAAAAAYQCAgAAAAGFAgAA7QMAIAEYAADwAgAwARgAAPACADAI_gEBAOgDACH_AQEA6AMAIYACQADpAwAhgQJAAOoDACGCAgIA6wMAIYMCAgDrAwAhhAICAOsDACGFAgAA7AMAIAIAAADmAgAgGAAA8wIAIAj-AQEA6AMAIf8BAQDoAwAhgAJAAOkDACGBAkAA6gMAIYICAgDrAwAhgwICAOsDACGEAgIA6wMAIYUCAADsAwAgAgAAAOkCACAYAAD1AgAgAgAAAOkCACAYAAD1AgAgAwAAAOYCACAfAADuAgAgIAAA8wIAIAEAAADmAgAgAQAAAOkCACAGBQAA4wMAICUAAOYDACAmAADlAwAgNwAA5AMAIDgAAOcDACCBAgAA4gMAIAv7AQAA_wIAMPwBAAD8AgAQ_QEAAP8CADD-AQEAgAMAIf8BAQCAAwAhgAJAAIEDACGBAkAAggMAIYICAgCDAwAhgwICAIMDACGEAgIAgwMAIYUCAACEAwAgAwAAAOkCACABAAD7AgAwJAAA_AIAIAMAAADpAgAgAQAA6gIAMAIAAOYCACAL-wEAAP8CADD8AQAA_AIAEP0BAAD_AgAw_gEBAIADACH_AQEAgAMAIYACQACBAwAhgQJAAIIDACGCAgIAgwMAIYMCAgCDAwAhhAICAIMDACGFAgAAhAMAIA4FAACGAwAgJQAAjgMAICYAAI4DACCGAgEAAAABigIBAAAABIsCAQAAAASMAgEAAAABjQIBAAAAAY4CAQAAAAGPAgEAAAABkAIBAI0DACGRAgEAAAABkgIBAAAAAZMCAQAAAAELBQAAhgMAICUAAIwDACAmAACMAwAghgJAAAAAAYoCQAAAAASLAkAAAAAEjAJAAAAAAY0CQAAAAAGOAkAAAAABjwJAAAAAAZACQACLAwAhCwUAAIkDACAlAACKAwAgJgAAigMAIIYCQAAAAAGKAkAAAAAFiwJAAAAABYwCQAAAAAGNAkAAAAABjgJAAAAAAY8CQAAAAAGQAkAAiAMAIQ0FAACGAwAgJQAAhgMAICYAAIYDACA3AACHAwAgOAAAhgMAIIYCAgAAAAGKAgIAAAAEiwICAAAABIwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAhQMAIQSGAgEAAAAFhwIBAAAAAYgCAQAAAASJAgEAAAAEDQUAAIYDACAlAACGAwAgJgAAhgMAIDcAAIcDACA4AACGAwAghgICAAAAAYoCAgAAAASLAgIAAAAEjAICAAAAAY0CAgAAAAGOAgIAAAABjwICAAAAAZACAgCFAwAhCIYCAgAAAAGKAgIAAAAEiwICAAAABIwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAhgMAIQiGAggAAAABigIIAAAABIsCCAAAAASMAggAAAABjQIIAAAAAY4CCAAAAAGPAggAAAABkAIIAIcDACELBQAAiQMAICUAAIoDACAmAACKAwAghgJAAAAAAYoCQAAAAAWLAkAAAAAFjAJAAAAAAY0CQAAAAAGOAkAAAAABjwJAAAAAAZACQACIAwAhCIYCAgAAAAGKAgIAAAAFiwICAAAABYwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAiQMAIQiGAkAAAAABigJAAAAABYsCQAAAAAWMAkAAAAABjQJAAAAAAY4CQAAAAAGPAkAAAAABkAJAAIoDACELBQAAhgMAICUAAIwDACAmAACMAwAghgJAAAAAAYoCQAAAAASLAkAAAAAEjAJAAAAAAY0CQAAAAAGOAkAAAAABjwJAAAAAAZACQACLAwAhCIYCQAAAAAGKAkAAAAAEiwJAAAAABIwCQAAAAAGNAkAAAAABjgJAAAAAAY8CQAAAAAGQAkAAjAMAIQ4FAACGAwAgJQAAjgMAICYAAI4DACCGAgEAAAABigIBAAAABIsCAQAAAASMAgEAAAABjQIBAAAAAY4CAQAAAAGPAgEAAAABkAIBAI0DACGRAgEAAAABkgIBAAAAAZMCAQAAAAELhgIBAAAAAYoCAQAAAASLAgEAAAAEjAIBAAAAAY0CAQAAAAGOAgEAAAABjwIBAAAAAZACAQCOAwAhkQIBAAAAAZICAQAAAAGTAgEAAAABC_sBAACPAwAw_AEAAOkCABD9AQAAjwMAMP4BAQCQAwAh_wEBAJADACGAAkAAkQMAIYECQACSAwAhggICAJMDACGDAgIAkwMAIYQCAgCTAwAhhQIAAIQDACALhgIBAAAAAYoCAQAAAASLAgEAAAAEjAIBAAAAAY0CAQAAAAGOAgEAAAABjwIBAAAAAZACAQCOAwAhkQIBAAAAAZICAQAAAAGTAgEAAAABCIYCQAAAAAGKAkAAAAAEiwJAAAAABIwCQAAAAAGNAkAAAAABjgJAAAAAAY8CQAAAAAGQAkAAjAMAIQiGAkAAAAABigJAAAAABYsCQAAAAAWMAkAAAAABjQJAAAAAAY4CQAAAAAGPAkAAAAABkAJAAIoDACEIhgICAAAAAYoCAgAAAASLAgIAAAAEjAICAAAAAY0CAgAAAAGOAgIAAAABjwICAAAAAZACAgCGAwAhB_sBAACUAwAw_AEAAOMCABD9AQAAlAMAMJQCAQCAAwAhlQIgAJUDACGWAiAAlQMAIZcCIACVAwAhBQUAAIYDACAlAACXAwAgJgAAlwMAIIYCIAAAAAGQAiAAlgMAIQUFAACGAwAgJQAAlwMAICYAAJcDACCGAiAAAAABkAIgAJYDACEChgIgAAAAAZACIACXAwAhCAMAAJoDACD7AQAAmAMAMPwBAAA3ABD9AQAAmAMAMJQCAQCQAwAhlQIgAJkDACGWAiAAmQMAIZcCIACZAwAhAoYCIAAAAAGQAiAAlwMAIRMMAADFAwAgDwAAxgMAIBAAAMkDACARAADKAwAgEgAAywMAIPsBAADIAwAw_AEAAD4AEP0BAADIAwAw_gEBAJADACGaAkAAkQMAIZ8CQACRAwAhyAIBAJADACHJAgEAvQMAIcoCAQC9AwAhywIBAL0DACHMAgEAvQMAIc0CIACZAwAh1AIAAD4AINUCAAA-ACAI-wEAAJsDADD8AQAAywIAEP0BAACbAwAw_gEBAIADACGUAgEAgAMAIZgCAQCAAwAhmQIBAIADACGaAkAAgQMAIQf7AQAAnAMAMPwBAAC1AgAQ_QEAAJwDADD-AQEAgAMAIZQCAQCAAwAhmgJAAIEDACGbAgEAgAMAIQn7AQAAnQMAMPwBAACfAgAQ_QEAAJ0DADD-AQEAgAMAIZQCAQCAAwAhmgJAAIEDACGcAgEAgAMAIZ4CAACeA54CIp8CQACBAwAhBwUAAIYDACAlAACgAwAgJgAAoAMAIIYCAAAAngICigIAAACeAgiLAgAAAJ4CCJACAACfA54CIgcFAACGAwAgJQAAoAMAICYAAKADACCGAgAAAJ4CAooCAAAAngIIiwIAAACeAgiQAgAAnwOeAiIEhgIAAACeAgKKAgAAAJ4CCIsCAAAAngIIkAIAAKADngIiC_sBAAChAwAw_AEAAIkCABD9AQAAoQMAMP4BAQCAAwAhlAIBAIADACGcAgEAgAMAIZ8CQACBAwAhoAIBAIADACGhAgIAgwMAIaICAgCDAwAhowIgAJUDACEK-wEAAKIDADD8AQAA8wEAEP0BAACiAwAw_gEBAIADACGaAkAAgQMAIaACAQCAAwAhpAIBAIADACGlAgEAgAMAIaYCAQCjAwAhpwIBAKMDACEOBQAAiQMAICUAAKUDACAmAAClAwAghgIBAAAAAYoCAQAAAAWLAgEAAAAFjAIBAAAAAY0CAQAAAAGOAgEAAAABjwIBAAAAAZACAQCkAwAhkQIBAAAAAZICAQAAAAGTAgEAAAABDgUAAIkDACAlAAClAwAgJgAApQMAIIYCAQAAAAGKAgEAAAAFiwIBAAAABYwCAQAAAAGNAgEAAAABjgIBAAAAAY8CAQAAAAGQAgEApAMAIZECAQAAAAGSAgEAAAABkwIBAAAAAQuGAgEAAAABigIBAAAABYsCAQAAAAWMAgEAAAABjQIBAAAAAY4CAQAAAAGPAgEAAAABkAIBAKUDACGRAgEAAAABkgIBAAAAAZMCAQAAAAEI-wEAAKYDADD8AQAA3QEAEP0BAACmAwAw_gEBAIADACGgAgEAgAMAIaQCAQCAAwAhqAIBAIADACGpAgEAgAMAIQ37AQAApwMAMPwBAADHAQAQ_QEAAKcDADD-AQEAgAMAIZoCQACBAwAhnAIBAIADACGqAgEAowMAIasCAgCDAwAhrAIBAIADACGtAgEAgAMAIa4CAQCjAwAhrwJAAIIDACGwAgIAqAMAIQ0FAACJAwAgJQAAiQMAICYAAIkDACA3AACqAwAgOAAAiQMAIIYCAgAAAAGKAgIAAAAFiwICAAAABYwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAqQMAIQ0FAACJAwAgJQAAiQMAICYAAIkDACA3AACqAwAgOAAAiQMAIIYCAgAAAAGKAgIAAAAFiwICAAAABYwCAgAAAAGNAgIAAAABjgICAAAAAY8CAgAAAAGQAgIAqQMAIQiGAggAAAABigIIAAAABYsCCAAAAAWMAggAAAABjQIIAAAAAY4CCAAAAAGPAggAAAABkAIIAKoDACEH-wEAAKsDADD8AQAArwEAEP0BAACrAwAw_gEBAIADACGcAgEAgAMAIawCAQCAAwAhsQICAIMDACEF-wEAAKwDADD8AQAAmQEAEP0BAACsAwAwnAIBAIADACGyAgIAgwMAIQX7AQAArQMAMPwBAACDAQAQ_QEAAK0DADD-AQIAgwMAIbMCAQCAAwAhBgQAAK8DACD7AQAArgMAMPwBAABwABD9AQAArgMAMP4BAgCTAwAhswIBAJADACEDtAIAAAcAILUCAAAHACC2AgAABwAgGQgAALEDwAIj-wEAALADADD8AQAAagAQ_QEAALADADD-AQEAgAMAIZoCQACBAwAhngIAALIDwQIinwJAAIEDACGsAgEAgAMAIa0CAQCAAwAhsAICAKgDACG3AgEAowMAIbgCAQCjAwAhuQIBAKMDACG6AgAAhAMAILsCAQCjAwAhvAIBAKMDACG9AgIAqAMAIb4CAgCoAwAhwgIAALMDwgIiwwIIALQDACHEAgIAgwMAIcUCAgCoAwAhxgIBAKMDACHHAkAAggMAIQcFAACJAwAgJQAAuwMAICYAALsDACCGAgAAAMACA4oCAAAAwAIJiwIAAADAAgmQAgAAugPAAiMHBQAAhgMAICUAALkDACAmAAC5AwAghgIAAADBAgKKAgAAAMECCIsCAAAAwQIIkAIAALgDwQIiBwUAAIYDACAlAAC3AwAgJgAAtwMAIIYCAAAAwgICigIAAADCAgiLAgAAAMICCJACAAC2A8ICIg0FAACJAwAgJQAAqgMAICYAAKoDACA3AACqAwAgOAAAqgMAIIYCCAAAAAGKAggAAAAFiwIIAAAABYwCCAAAAAGNAggAAAABjgIIAAAAAY8CCAAAAAGQAggAtQMAIQ0FAACJAwAgJQAAqgMAICYAAKoDACA3AACqAwAgOAAAqgMAIIYCCAAAAAGKAggAAAAFiwIIAAAABYwCCAAAAAGNAggAAAABjgIIAAAAAY8CCAAAAAGQAggAtQMAIQcFAACGAwAgJQAAtwMAICYAALcDACCGAgAAAMICAooCAAAAwgIIiwIAAADCAgiQAgAAtgPCAiIEhgIAAADCAgKKAgAAAMICCIsCAAAAwgIIkAIAALcDwgIiBwUAAIYDACAlAAC5AwAgJgAAuQMAIIYCAAAAwQICigIAAADBAgiLAgAAAMECCJACAAC4A8ECIgSGAgAAAMECAooCAAAAwQIIiwIAAADBAgiQAgAAuQPBAiIHBQAAiQMAICUAALsDACAmAAC7AwAghgIAAADAAgOKAgAAAMACCYsCAAAAwAIJkAIAALoDwAIjBIYCAAAAwAIDigIAAADAAgmLAgAAAMACCZACAAC7A8ACIx4HAACvAwAgCAAAvwPAAiMMAADFAwAgDQAAxAMAIA4AAMMDACAPAADGAwAg-wEAALwDADD8AQAAVwAQ_QEAALwDADD-AQEAkAMAIZoCQACRAwAhngIAAMADwQIinwJAAJEDACGsAgEAkAMAIa0CAQCQAwAhsAICAL4DACG3AgEAvQMAIbgCAQC9AwAhuQIBAL0DACG6AgAAhAMAILsCAQC9AwAhvAIBAL0DACG9AgIAvgMAIb4CAgC-AwAhwgIAAMEDwgIiwwIIAMIDACHEAgIAkwMAIcUCAgC-AwAhxgIBAL0DACHHAkAAkgMAIQuGAgEAAAABigIBAAAABYsCAQAAAAWMAgEAAAABjQIBAAAAAY4CAQAAAAGPAgEAAAABkAIBAKUDACGRAgEAAAABkgIBAAAAAZMCAQAAAAEIhgICAAAAAYoCAgAAAAWLAgIAAAAFjAICAAAAAY0CAgAAAAGOAgIAAAABjwICAAAAAZACAgCJAwAhBIYCAAAAwAIDigIAAADAAgmLAgAAAMACCZACAAC7A8ACIwSGAgAAAMECAooCAAAAwQIIiwIAAADBAgiQAgAAuQPBAiIEhgIAAADCAgKKAgAAAMICCIsCAAAAwgIIkAIAALcDwgIiCIYCCAAAAAGKAggAAAAFiwIIAAAABYwCCAAAAAGNAggAAAABjgIIAAAAAY8CCAAAAAGQAggAqgMAIQO0AgAADQAgtQIAAA0AILYCAAANACADtAIAABEAILUCAAARACC2AgAAEQAgA7QCAAADACC1AgAAAwAgtgIAAAMAIAO0AgAAJQAgtQIAACUAILYCAAAlACAM-wEAAMcDADD8AQAAUQAQ_QEAAMcDADD-AQEAgAMAIZoCQACBAwAhnwJAAIEDACHIAgEAgAMAIckCAQCjAwAhygIBAKMDACHLAgEAowMAIcwCAQCjAwAhzQIgAJUDACERDAAAxQMAIA8AAMYDACAQAADJAwAgEQAAygMAIBIAAMsDACD7AQAAyAMAMPwBAAA-ABD9AQAAyAMAMP4BAQCQAwAhmgJAAJEDACGfAkAAkQMAIcgCAQCQAwAhyQIBAL0DACHKAgEAvQMAIcsCAQC9AwAhzAIBAL0DACHNAiAAmQMAIQO0AgAALwAgtQIAAC8AILYCAAAvACADtAIAADMAILUCAAAzACC2AgAAMwAgCgMAAJoDACD7AQAAmAMAMPwBAAA3ABD9AQAAmAMAMJQCAQCQAwAhlQIgAJkDACGWAiAAmQMAIZcCIACZAwAh1AIAADcAINUCAAA3ACAJAwAAmgMAIPsBAADMAwAw_AEAADMAEP0BAADMAwAw_gEBAJADACGUAgEAkAMAIZgCAQCQAwAhmQIBAJADACGaAkAAkQMAIQKUAgEAAAABmwIBAAAAAQgDAACaAwAg-wEAAM4DADD8AQAALwAQ_QEAAM4DADD-AQEAkAMAIZQCAQCQAwAhmgJAAJEDACGbAgEAkAMAIQKUAgEAAAABnAIBAAAAAQsDAACaAwAgBAAA0gMAIPsBAADQAwAw_AEAACUAEP0BAADQAwAw_gEBAJADACGUAgEAkAMAIZoCQACRAwAhnAIBAJADACGeAgAA0QOeAiKfAkAAkQMAIQSGAgAAAJ4CAooCAAAAngIIiwIAAACeAgiQAgAAoAOeAiIgBwAArwMAIAgAAL8DwAIjDAAAxQMAIA0AAMQDACAOAADDAwAgDwAAxgMAIPsBAAC8AwAw_AEAAFcAEP0BAAC8AwAw_gEBAJADACGaAkAAkQMAIZ4CAADAA8ECIp8CQACRAwAhrAIBAJADACGtAgEAkAMAIbACAgC-AwAhtwIBAL0DACG4AgEAvQMAIbkCAQC9AwAhugIAAIQDACC7AgEAvQMAIbwCAQC9AwAhvQICAL4DACG-AgIAvgMAIcICAADBA8ICIsMCCADCAwAhxAICAJMDACHFAgIAvgMAIcYCAQC9AwAhxwJAAJIDACHUAgAAVwAg1QIAAFcAIAsJAADUAwAg-wEAANMDADD8AQAAGgAQ_QEAANMDADD-AQEAkAMAIZoCQACRAwAhoAIBAJADACGkAgEAkAMAIaUCAQCQAwAhpgIBAL0DACGnAgEAvQMAIRQEAADSAwAgCAAA2AMAIAoAANkDACALAADaAwAgDAAAxQMAIPsBAADXAwAw_AEAABEAEP0BAADXAwAw_gEBAJADACGaAkAAkQMAIZwCAQCQAwAhqgIBAL0DACGrAgIAkwMAIawCAQCQAwAhrQIBAJADACGuAgEAvQMAIa8CQACSAwAhsAICAL4DACHUAgAAEQAg1QIAABEAIAkJAADUAwAg-wEAANUDADD8AQAAFgAQ_QEAANUDADD-AQEAkAMAIaACAQCQAwAhpAIBAJADACGoAgEAkAMAIakCAQCQAwAhA5wCAQAAAAGqAgEAAAABqwICAAAAARIEAADSAwAgCAAA2AMAIAoAANkDACALAADaAwAgDAAAxQMAIPsBAADXAwAw_AEAABEAEP0BAADXAwAw_gEBAJADACGaAkAAkQMAIZwCAQCQAwAhqgIBAL0DACGrAgIAkwMAIawCAQCQAwAhrQIBAJADACGuAgEAvQMAIa8CQACSAwAhsAICAL4DACELBAAA0gMAIA0AAMQDACD7AQAA3AMAMPwBAAANABD9AQAA3AMAMP4BAQCQAwAhnAIBAJADACGsAgEAkAMAIbECAgCTAwAh1AIAAA0AINUCAAANACADtAIAABYAILUCAAAWACC2AgAAFgAgA7QCAAAaACC1AgAAGgAgtgIAABoAIAKcAgEAAAABsQICAAAAAQkEAADSAwAgDQAAxAMAIPsBAADcAwAw_AEAAA0AEP0BAADcAwAw_gEBAJADACGcAgEAkAMAIawCAQCQAwAhsQICAJMDACECnAIBAAAAAbICAgAAAAEHBAAA0gMAIAYAAN8DACD7AQAA3gMAMPwBAAAHABD9AQAA3gMAMJwCAQCQAwAhsgICAJMDACEIBAAArwMAIPsBAACuAwAw_AEAAHAAEP0BAACuAwAw_gECAJMDACGzAgEAkAMAIdQCAABwACDVAgAAcAAgApQCAQAAAAGgAgEAAAABDgMAAJoDACAEAADSAwAgCQAA1AMAIPsBAADhAwAw_AEAAAMAEP0BAADhAwAw_gEBAJADACGUAgEAkAMAIZwCAQCQAwAhnwJAAJEDACGgAgEAkAMAIaECAgCTAwAhogICAJMDACGjAiAAmQMAIQAAAAAAAAHZAgEAAAABAdkCQAAAAAEB2QJAAAAAAQXZAgIAAAAB3wICAAAAAeACAgAAAAHhAgIAAAAB4gICAAAAAQLZAgEAAAAE4wIBAAAABQHZAgEAAAAEAAAAAdkCIAAAAAEFHwAA6AYAICAAAOsGACDWAgAA6QYAINcCAADqBgAg3AIAAAEAIAMfAADoBgAg1gIAAOkGACDcAgAAAQAgCQwAAM0FACAPAADOBQAgEAAAiwYAIBEAAIwGACASAACNBgAgyQIAAOIDACDKAgAA4gMAIMsCAADiAwAgzAIAAOIDACAAAAAFHwAA4wYAICAAAOYGACDWAgAA5AYAINcCAADlBgAg3AIAAAEAIAMfAADjBgAg1gIAAOQGACDcAgAAAQAgAAAABR8AAN4GACAgAADhBgAg1gIAAN8GACDXAgAA4AYAINwCAAABACADHwAA3gYAINYCAADfBgAg3AIAAAEAIAAAAAHZAgAAAJ4CAgUfAADWBgAgIAAA3AYAINYCAADXBgAg1wIAANsGACDcAgAAAQAgBR8AANQGACAgAADZBgAg1gIAANUGACDXAgAA2AYAINwCAABUACADHwAA1gYAINYCAADXBgAg3AIAAAEAIAMfAADUBgAg1gIAANUGACDcAgAAVAAgAAAAAAAFHwAAyQYAICAAANIGACDWAgAAygYAINcCAADRBgAg3AIAAAEAIAUfAADHBgAgIAAAzwYAINYCAADIBgAg1wIAAM4GACDcAgAAVAAgBR8AAMUGACAgAADMBgAg1gIAAMYGACDXAgAAywYAINwCAAATACADHwAAyQYAINYCAADKBgAg3AIAAAEAIAMfAADHBgAg1gIAAMgGACDcAgAAVAAgAx8AAMUGACDWAgAAxgYAINwCAAATACAAAAAB2QIBAAAAAQUfAADABgAgIAAAwwYAINYCAADBBgAg1wIAAMIGACDcAgAAEwAgAx8AAMAGACDWAgAAwQYAINwCAAATACAAAAAFHwAAuwYAICAAAL4GACDWAgAAvAYAINcCAAC9BgAg3AIAABMAIAMfAAC7BgAg1gIAALwGACDcAgAAEwAgAAAAAAAF2QICAAAAAd8CAgAAAAHgAgIAAAAB4QICAAAAAeICAgAAAAEFHwAAsAYAICAAALkGACDWAgAAsQYAINcCAAC4BgAg3AIAAFQAIAcfAACuBgAgIAAAtgYAINYCAACvBgAg1wIAALUGACDaAgAADQAg2wIAAA0AINwCAAAPACALHwAAwAQAMCAAAMUEADDWAgAAwQQAMNcCAADCBAAw2AIAAMMEACDZAgAAxAQAMNoCAADEBAAw2wIAAMQEADDcAgAAxAQAMN0CAADGBAAw3gIAAMcEADALHwAAtAQAMCAAALkEADDWAgAAtQQAMNcCAAC2BAAw2AIAALcEACDZAgAAuAQAMNoCAAC4BAAw2wIAALgEADDcAgAAuAQAMN0CAAC6BAAw3gIAALsEADALHwAAqAQAMCAAAK0EADDWAgAAqQQAMNcCAACqBAAw2AIAAKsEACDZAgAArAQAMNoCAACsBAAw2wIAAKwEADDcAgAArAQAMN0CAACuBAAw3gIAAK8EADAJAwAAjwQAIAQAAJAEACD-AQEAAAABlAIBAAAAAZwCAQAAAAGfAkAAAAABoQICAAAAAaICAgAAAAGjAiAAAAABAgAAAAUAIB8AALMEACADAAAABQAgHwAAswQAICAAALIEACABGAAAtAYAMA8DAACaAwAgBAAA0gMAIAkAANQDACD7AQAA4QMAMPwBAAADABD9AQAA4QMAMP4BAQAAAAGUAgEAkAMAIZwCAQCQAwAhnwJAAJEDACGgAgEAkAMAIaECAgCTAwAhogICAJMDACGjAiAAmQMAIdMCAADgAwAgAgAAAAUAIBgAALIEACACAAAAsAQAIBgAALEEACAL-wEAAK8EADD8AQAAsAQAEP0BAACvBAAw_gEBAJADACGUAgEAkAMAIZwCAQCQAwAhnwJAAJEDACGgAgEAkAMAIaECAgCTAwAhogICAJMDACGjAiAAmQMAIQv7AQAArwQAMPwBAACwBAAQ_QEAAK8EADD-AQEAkAMAIZQCAQCQAwAhnAIBAJADACGfAkAAkQMAIaACAQCQAwAhoQICAJMDACGiAgIAkwMAIaMCIACZAwAhB_4BAQDoAwAhlAIBAOgDACGcAgEA6AMAIZ8CQADpAwAhoQICAOsDACGiAgIA6wMAIaMCIADxAwAhCQMAAIwEACAEAACNBAAg_gEBAOgDACGUAgEA6AMAIZwCAQDoAwAhnwJAAOkDACGhAgIA6wMAIaICAgDrAwAhowIgAPEDACEJAwAAjwQAIAQAAJAEACD-AQEAAAABlAIBAAAAAZwCAQAAAAGfAkAAAAABoQICAAAAAaICAgAAAAGjAiAAAAABBv4BAQAAAAGaAkAAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAQIAAAAcACAfAAC_BAAgAwAAABwAIB8AAL8EACAgAAC-BAAgARgAALMGADALCQAA1AMAIPsBAADTAwAw_AEAABoAEP0BAADTAwAw_gEBAAAAAZoCQACRAwAhoAIBAJADACGkAgEAkAMAIaUCAQCQAwAhpgIBAL0DACGnAgEAvQMAIQIAAAAcACAYAAC-BAAgAgAAALwEACAYAAC9BAAgCvsBAAC7BAAw_AEAALwEABD9AQAAuwQAMP4BAQCQAwAhmgJAAJEDACGgAgEAkAMAIaQCAQCQAwAhpQIBAJADACGmAgEAvQMAIacCAQC9AwAhCvsBAAC7BAAw_AEAALwEABD9AQAAuwQAMP4BAQCQAwAhmgJAAJEDACGgAgEAkAMAIaQCAQCQAwAhpQIBAJADACGmAgEAvQMAIacCAQC9AwAhBv4BAQDoAwAhmgJAAOkDACGkAgEA6AMAIaUCAQDoAwAhpgIBAJUEACGnAgEAlQQAIQb-AQEA6AMAIZoCQADpAwAhpAIBAOgDACGlAgEA6AMAIaYCAQCVBAAhpwIBAJUEACEG_gEBAAAAAZoCQAAAAAGkAgEAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABBP4BAQAAAAGkAgEAAAABqAIBAAAAAakCAQAAAAECAAAAGAAgHwAAywQAIAMAAAAYACAfAADLBAAgIAAAygQAIAEYAACyBgAwCQkAANQDACD7AQAA1QMAMPwBAAAWABD9AQAA1QMAMP4BAQAAAAGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQIAAAAYACAYAADKBAAgAgAAAMgEACAYAADJBAAgCPsBAADHBAAw_AEAAMgEABD9AQAAxwQAMP4BAQCQAwAhoAIBAJADACGkAgEAkAMAIagCAQCQAwAhqQIBAJADACEI-wEAAMcEADD8AQAAyAQAEP0BAADHBAAw_gEBAJADACGgAgEAkAMAIaQCAQCQAwAhqAIBAJADACGpAgEAkAMAIQT-AQEA6AMAIaQCAQDoAwAhqAIBAOgDACGpAgEA6AMAIQT-AQEA6AMAIaQCAQDoAwAhqAIBAOgDACGpAgEA6AMAIQT-AQEAAAABpAIBAAAAAagCAQAAAAGpAgEAAAABAx8AALAGACDWAgAAsQYAINwCAABUACADHwAArgYAINYCAACvBgAg3AIAAA8AIAQfAADABAAw1gIAAMEEADDYAgAAwwQAINwCAADEBAAwBB8AALQEADDWAgAAtQQAMNgCAAC3BAAg3AIAALgEADAEHwAAqAQAMNYCAACpBAAw2AIAAKsEACDcAgAArAQAMAAAAAAABR8AAKgGACAgAACsBgAg1gIAAKkGACDXAgAAqwYAINwCAABUACALHwAA2AQAMCAAAN0EADDWAgAA2QQAMNcCAADaBAAw2AIAANsEACDZAgAA3AQAMNoCAADcBAAw2wIAANwEADDcAgAA3AQAMN0CAADeBAAw3gIAAN8EADANBAAAzAQAIAoAAM4EACALAADPBAAgDAAA0AQAIP4BAQAAAAGaAkAAAAABnAIBAAAAAasCAgAAAAGsAgEAAAABrQIBAAAAAa4CAQAAAAGvAkAAAAABsAICAAAAAQIAAAATACAfAADjBAAgAwAAABMAIB8AAOMEACAgAADiBAAgARgAAKoGADATBAAA0gMAIAgAANgDACAKAADZAwAgCwAA2gMAIAwAAMUDACD7AQAA1wMAMPwBAAARABD9AQAA1wMAMP4BAQAAAAGaAkAAkQMAIZwCAQCQAwAhqgIBAL0DACGrAgIAkwMAIawCAQCQAwAhrQIBAJADACGuAgEAvQMAIa8CQACSAwAhsAICAL4DACHQAgAA1gMAIAIAAAATACAYAADiBAAgAgAAAOAEACAYAADhBAAgDfsBAADfBAAw_AEAAOAEABD9AQAA3wQAMP4BAQCQAwAhmgJAAJEDACGcAgEAkAMAIaoCAQC9AwAhqwICAJMDACGsAgEAkAMAIa0CAQCQAwAhrgIBAL0DACGvAkAAkgMAIbACAgC-AwAhDfsBAADfBAAw_AEAAOAEABD9AQAA3wQAMP4BAQCQAwAhmgJAAJEDACGcAgEAkAMAIaoCAQC9AwAhqwICAJMDACGsAgEAkAMAIa0CAQCQAwAhrgIBAL0DACGvAkAAkgMAIbACAgC-AwAhCf4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQ0EAACjBAAgCgAApQQAIAsAAKYEACAMAACnBAAg_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhDQQAAMwEACAKAADOBAAgCwAAzwQAIAwAANAEACD-AQEAAAABmgJAAAAAAZwCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEDHwAAqAYAINYCAACpBgAg3AIAAFQAIAQfAADYBAAw1gIAANkEADDYAgAA2wQAINwCAADcBAAwAAAAAAAFHwAAoAYAICAAAKYGACDWAgAAoQYAINcCAAClBgAg3AIAAFQAIAUfAACeBgAgIAAAowYAINYCAACfBgAg1wIAAKIGACDcAgAAbQAgAx8AAKAGACDWAgAAoQYAINwCAABUACADHwAAngYAINYCAACfBgAg3AIAAG0AIAAAAAAACx8AAPUEADAgAAD6BAAw1gIAAPYEADDXAgAA9wQAMNgCAAD4BAAg2QIAAPkEADDaAgAA-QQAMNsCAAD5BAAw3AIAAPkEADDdAgAA-wQAMN4CAAD8BAAwAgQAAO0EACCcAgEAAAABAgAAAAkAIB8AAIAFACADAAAACQAgHwAAgAUAICAAAP8EACABGAAAnQYAMAgEAADSAwAgBgAA3wMAIPsBAADeAwAw_AEAAAcAEP0BAADeAwAwnAIBAJADACGyAgIAkwMAIdICAADdAwAgAgAAAAkAIBgAAP8EACACAAAA_QQAIBgAAP4EACAF-wEAAPwEADD8AQAA_QQAEP0BAAD8BAAwnAIBAJADACGyAgIAkwMAIQX7AQAA_AQAMPwBAAD9BAAQ_QEAAPwEADCcAgEAkAMAIbICAgCTAwAhAZwCAQDoAwAhAgQAAOsEACCcAgEA6AMAIQIEAADtBAAgnAIBAAAAAQQfAAD1BAAw1gIAAPYEADDYAgAA-AQAINwCAAD5BAAwAAAAAAAAAtkCAQAAAATjAgEAAAAFAdkCAAAAwAIDAdkCAAAAwQICAdkCAAAAwgICBdkCCAAAAAHfAggAAAAB4AIIAAAAAeECCAAAAAHiAggAAAABCx8AALwFADAgAADABQAw1gIAAL0FADDXAgAAvgUAMNgCAAC_BQAg2QIAAPkEADDaAgAA-QQAMNsCAAD5BAAw3AIAAPkEADDdAgAAwQUAMN4CAAD8BAAwCx8AALAFADAgAAC1BQAw1gIAALEFADDXAgAAsgUAMNgCAACzBQAg2QIAALQFADDaAgAAtAUAMNsCAAC0BQAw3AIAALQFADDdAgAAtgUAMN4CAAC3BQAwCx8AAKcFADAgAACrBQAw1gIAAKgFADDXAgAAqQUAMNgCAACqBQAg2QIAANwEADDaAgAA3AQAMNsCAADcBAAw3AIAANwEADDdAgAArAUAMN4CAADfBAAwCx8AAJ4FADAgAACiBQAw1gIAAJ8FADDXAgAAoAUAMNgCAAChBQAg2QIAAKwEADDaAgAArAQAMNsCAACsBAAw3AIAAKwEADDdAgAAowUAMN4CAACvBAAwCx8AAJIFADAgAACXBQAw1gIAAJMFADDXAgAAlAUAMNgCAACVBQAg2QIAAJYFADDaAgAAlgUAMNsCAACWBQAw3AIAAJYFADDdAgAAmAUAMN4CAACZBQAwBgMAAIUEACD-AQEAAAABlAIBAAAAAZoCQAAAAAGeAgAAAJ4CAp8CQAAAAAECAAAAJwAgHwAAnQUAIAMAAAAnACAfAACdBQAgIAAAnAUAIAEYAACcBgAwDAMAAJoDACAEAADSAwAg-wEAANADADD8AQAAJQAQ_QEAANADADD-AQEAAAABlAIBAJADACGaAkAAkQMAIZwCAQCQAwAhngIAANEDngIinwJAAJEDACHPAgAAzwMAIAIAAAAnACAYAACcBQAgAgAAAJoFACAYAACbBQAgCfsBAACZBQAw_AEAAJoFABD9AQAAmQUAMP4BAQCQAwAhlAIBAJADACGaAkAAkQMAIZwCAQCQAwAhngIAANEDngIinwJAAJEDACEJ-wEAAJkFADD8AQAAmgUAEP0BAACZBQAw_gEBAJADACGUAgEAkAMAIZoCQACRAwAhnAIBAJADACGeAgAA0QOeAiKfAkAAkQMAIQX-AQEA6AMAIZQCAQDoAwAhmgJAAOkDACGeAgAAggSeAiKfAkAA6QMAIQYDAACDBAAg_gEBAOgDACGUAgEA6AMAIZoCQADpAwAhngIAAIIEngIinwJAAOkDACEGAwAAhQQAIP4BAQAAAAGUAgEAAAABmgJAAAAAAZ4CAAAAngICnwJAAAAAAQkDAACPBAAgCQAAkQQAIP4BAQAAAAGUAgEAAAABnwJAAAAAAaACAQAAAAGhAgIAAAABogICAAAAAaMCIAAAAAECAAAABQAgHwAApgUAIAMAAAAFACAfAACmBQAgIAAApQUAIAEYAACbBgAwAgAAAAUAIBgAAKUFACACAAAAsAQAIBgAAKQFACAH_gEBAOgDACGUAgEA6AMAIZ8CQADpAwAhoAIBAOgDACGhAgIA6wMAIaICAgDrAwAhowIgAPEDACEJAwAAjAQAIAkAAI4EACD-AQEA6AMAIZQCAQDoAwAhnwJAAOkDACGgAgEA6AMAIaECAgDrAwAhogICAOsDACGjAiAA8QMAIQkDAACPBAAgCQAAkQQAIP4BAQAAAAGUAgEAAAABnwJAAAAAAaACAQAAAAGhAgIAAAABogICAAAAAaMCIAAAAAENCAAAzQQAIAoAAM4EACALAADPBAAgDAAA0AQAIP4BAQAAAAGaAkAAAAABqgIBAAAAAasCAgAAAAGsAgEAAAABrQIBAAAAAa4CAQAAAAGvAkAAAAABsAICAAAAAQIAAAATACAfAACvBQAgAwAAABMAIB8AAK8FACAgAACuBQAgARgAAJoGADACAAAAEwAgGAAArgUAIAIAAADgBAAgGAAArQUAIAn-AQEA6AMAIZoCQADpAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACENCAAApAQAIAoAAKUEACALAACmBAAgDAAApwQAIP4BAQDoAwAhmgJAAOkDACGqAgEAlQQAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQ0IAADNBAAgCgAAzgQAIAsAAM8EACAMAADQBAAg_gEBAAAAAZoCQAAAAAGqAgEAAAABqwICAAAAAawCAQAAAAGtAgEAAAABrgIBAAAAAa8CQAAAAAGwAgIAAAABBA0AAOUEACD-AQEAAAABrAIBAAAAAbECAgAAAAECAAAADwAgHwAAuwUAIAMAAAAPACAfAAC7BQAgIAAAugUAIAEYAACZBgAwCgQAANIDACANAADEAwAg-wEAANwDADD8AQAADQAQ_QEAANwDADD-AQEAAAABnAIBAJADACGsAgEAkAMAIbECAgCTAwAh0QIAANsDACACAAAADwAgGAAAugUAIAIAAAC4BQAgGAAAuQUAIAf7AQAAtwUAMPwBAAC4BQAQ_QEAALcFADD-AQEAkAMAIZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIQf7AQAAtwUAMPwBAAC4BQAQ_QEAALcFADD-AQEAkAMAIZwCAQCQAwAhrAIBAJADACGxAgIAkwMAIQP-AQEA6AMAIawCAQDoAwAhsQICAOsDACEEDQAA1wQAIP4BAQDoAwAhrAIBAOgDACGxAgIA6wMAIQQNAADlBAAg_gEBAAAAAawCAQAAAAGxAgIAAAABAgYAAO4EACCyAgIAAAABAgAAAAkAIB8AAMQFACADAAAACQAgHwAAxAUAICAAAMMFACABGAAAmAYAMAIAAAAJACAYAADDBQAgAgAAAP0EACAYAADCBQAgAbICAgDrAwAhAgYAAOwEACCyAgIA6wMAIQIGAADuBAAgsgICAAAAAQHZAgEAAAAEBB8AALwFADDWAgAAvQUAMNgCAAC_BQAg3AIAAPkEADAEHwAAsAUAMNYCAACxBQAw2AIAALMFACDcAgAAtAUAMAQfAACnBQAw1gIAAKgFADDYAgAAqgUAINwCAADcBAAwBB8AAJ4FADDWAgAAnwUAMNgCAAChBQAg3AIAAKwEADAEHwAAkgUAMNYCAACTBQAw2AIAAJUFACDcAgAAlgUAMAAAAAAAAAALHwAA_QUAMCAAAIEGADDWAgAA_gUAMNcCAAD_BQAw2AIAAIAGACDZAgAArAQAMNoCAACsBAAw2wIAAKwEADDcAgAArAQAMN0CAACCBgAw3gIAAK8EADALHwAA9AUAMCAAAPgFADDWAgAA9QUAMNcCAAD2BQAw2AIAAPcFACDZAgAAlgUAMNoCAACWBQAw2wIAAJYFADDcAgAAlgUAMN0CAAD5BQAw3gIAAJkFADALHwAA6AUAMCAAAO0FADDWAgAA6QUAMNcCAADqBQAw2AIAAOsFACDZAgAA7AUAMNoCAADsBQAw2wIAAOwFADDcAgAA7AUAMN0CAADuBQAw3gIAAO8FADALHwAA3AUAMCAAAOEFADDWAgAA3QUAMNcCAADeBQAw2AIAAN8FACDZAgAA4AUAMNoCAADgBQAw2wIAAOAFADDcAgAA4AUAMN0CAADiBQAw3gIAAOMFADAHHwAA1wUAICAAANoFACDWAgAA2AUAINcCAADZBQAg2gIAADcAINsCAAA3ACDcAgAAzgIAIAOVAiAAAAABlgIgAAAAAZcCIAAAAAECAAAAzgIAIB8AANcFACADAAAANwAgHwAA1wUAICAAANsFACAFAAAANwAgGAAA2wUAIJUCIADxAwAhlgIgAPEDACGXAiAA8QMAIQOVAiAA8QMAIZYCIADxAwAhlwIgAPEDACEE_gEBAAAAAZgCAQAAAAGZAgEAAAABmgJAAAAAAQIAAAA1ACAfAADnBQAgAwAAADUAIB8AAOcFACAgAADmBQAgARgAAJcGADAJAwAAmgMAIPsBAADMAwAw_AEAADMAEP0BAADMAwAw_gEBAAAAAZQCAQCQAwAhmAIBAAAAAZkCAQCQAwAhmgJAAJEDACECAAAANQAgGAAA5gUAIAIAAADkBQAgGAAA5QUAIAj7AQAA4wUAMPwBAADkBQAQ_QEAAOMFADD-AQEAkAMAIZQCAQCQAwAhmAIBAJADACGZAgEAkAMAIZoCQACRAwAhCPsBAADjBQAw_AEAAOQFABD9AQAA4wUAMP4BAQCQAwAhlAIBAJADACGYAgEAkAMAIZkCAQCQAwAhmgJAAJEDACEE_gEBAOgDACGYAgEA6AMAIZkCAQDoAwAhmgJAAOkDACEE_gEBAOgDACGYAgEA6AMAIZkCAQDoAwAhmgJAAOkDACEE_gEBAAAAAZgCAQAAAAGZAgEAAAABmgJAAAAAAQP-AQEAAAABmgJAAAAAAZsCAQAAAAECAAAAMQAgHwAA8wUAIAMAAAAxACAfAADzBQAgIAAA8gUAIAEYAACWBgAwCQMAAJoDACD7AQAAzgMAMPwBAAAvABD9AQAAzgMAMP4BAQAAAAGUAgEAkAMAIZoCQACRAwAhmwIBAJADACHOAgAAzQMAIAIAAAAxACAYAADyBQAgAgAAAPAFACAYAADxBQAgB_sBAADvBQAw_AEAAPAFABD9AQAA7wUAMP4BAQCQAwAhlAIBAJADACGaAkAAkQMAIZsCAQCQAwAhB_sBAADvBQAw_AEAAPAFABD9AQAA7wUAMP4BAQCQAwAhlAIBAJADACGaAkAAkQMAIZsCAQCQAwAhA_4BAQDoAwAhmgJAAOkDACGbAgEA6AMAIQP-AQEA6AMAIZoCQADpAwAhmwIBAOgDACED_gEBAAAAAZoCQAAAAAGbAgEAAAABBgQAAIYEACD-AQEAAAABmgJAAAAAAZwCAQAAAAGeAgAAAJ4CAp8CQAAAAAECAAAAJwAgHwAA_AUAIAMAAAAnACAfAAD8BQAgIAAA-wUAIAEYAACVBgAwAgAAACcAIBgAAPsFACACAAAAmgUAIBgAAPoFACAF_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhngIAAIIEngIinwJAAOkDACEGBAAAhAQAIP4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIZ4CAACCBJ4CIp8CQADpAwAhBgQAAIYEACD-AQEAAAABmgJAAAAAAZwCAQAAAAGeAgAAAJ4CAp8CQAAAAAEJBAAAkAQAIAkAAJEEACD-AQEAAAABnAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABAgAAAAUAIB8AAIUGACADAAAABQAgHwAAhQYAICAAAIQGACABGAAAlAYAMAIAAAAFACAYAACEBgAgAgAAALAEACAYAACDBgAgB_4BAQDoAwAhnAIBAOgDACGfAkAA6QMAIaACAQDoAwAhoQICAOsDACGiAgIA6wMAIaMCIADxAwAhCQQAAI0EACAJAACOBAAg_gEBAOgDACGcAgEA6AMAIZ8CQADpAwAhoAIBAOgDACGhAgIA6wMAIaICAgDrAwAhowIgAPEDACEJBAAAkAQAIAkAAJEEACD-AQEAAAABnAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABBB8AAP0FADDWAgAA_gUAMNgCAACABgAg3AIAAKwEADAEHwAA9AUAMNYCAAD1BQAw2AIAAPcFACDcAgAAlgUAMAQfAADoBQAw1gIAAOkFADDYAgAA6wUAINwCAADsBQAwBB8AANwFADDWAgAA3QUAMNgCAADfBQAg3AIAAOAFADADHwAA1wUAINYCAADYBQAg3AIAAM4CACAAAAEDAAD0AwAgEgcAAIIFACAIAADiAwAgDAAAzQUAIA0AAMwFACAOAADLBQAgDwAAzgUAILACAADiAwAgtwIAAOIDACC4AgAA4gMAILkCAADiAwAguwIAAOIDACC8AgAA4gMAIL0CAADiAwAgvgIAAOIDACDDAgAA4gMAIMUCAADiAwAgxgIAAOIDACDHAgAA4gMAIAkEAACOBgAgCAAAkAYAIAoAAJEGACALAACSBgAgDAAAzQUAIKoCAADiAwAgrgIAAOIDACCvAgAA4gMAILACAADiAwAgAgQAAI4GACANAADMBQAgAAABBAAAggUAIAf-AQEAAAABnAIBAAAAAZ8CQAAAAAGgAgEAAAABoQICAAAAAaICAgAAAAGjAiAAAAABBf4BAQAAAAGaAkAAAAABnAIBAAAAAZ4CAAAAngICnwJAAAAAAQP-AQEAAAABmgJAAAAAAZsCAQAAAAEE_gEBAAAAAZgCAQAAAAGZAgEAAAABmgJAAAAAAQGyAgIAAAABA_4BAQAAAAGsAgEAAAABsQICAAAAAQn-AQEAAAABmgJAAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEH_gEBAAAAAZQCAQAAAAGfAkAAAAABoAIBAAAAAaECAgAAAAGiAgIAAAABowIgAAAAAQX-AQEAAAABlAIBAAAAAZoCQAAAAAGeAgAAAJ4CAp8CQAAAAAEBnAIBAAAAAQL-AQIAAAABswIBAAAAAQIAAABtACAfAACeBgAgGggAAADAAgMMAADJBQAgDQAAyAUAIA4AAMcFACAPAADKBQAg_gEBAAAAAZoCQAAAAAGeAgAAAMECAp8CQAAAAAGsAgEAAAABrQIBAAAAAbACAgAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgAAxQUAILsCAQAAAAG8AgEAAAABvQICAAAAAb4CAgAAAAHCAgAAAMICAsMCCAAAAAHEAgIAAAABxQICAAAAAcYCAQAAAAHHAkAAAAABAgAAAFQAIB8AAKAGACADAAAAcAAgHwAAngYAICAAAKQGACAEAAAAcAAgGAAApAYAIP4BAgDrAwAhswIBAOgDACEC_gECAOsDACGzAgEA6AMAIQMAAABXACAfAACgBgAgIAAApwYAIBwAAABXACAIAACJBcACIwwAAJAFACANAACPBQAgDgAAjgUAIA8AAJEFACAYAACnBgAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACEaCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACEaBwAAxgUAIAgAAADAAgMMAADJBQAgDQAAyAUAIA8AAMoFACD-AQEAAAABmgJAAAAAAZ4CAAAAwQICnwJAAAAAAawCAQAAAAGtAgEAAAABsAICAAAAAbcCAQAAAAG4AgEAAAABuQIBAAAAAboCAADFBQAguwIBAAAAAbwCAQAAAAG9AgIAAAABvgICAAAAAcICAAAAwgICwwIIAAAAAcQCAgAAAAHFAgIAAAABxgIBAAAAAccCQAAAAAECAAAAVAAgHwAAqAYAIAn-AQEAAAABmgJAAAAAAZwCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAEDAAAAVwAgHwAAqAYAICAAAK0GACAcAAAAVwAgBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA0AAI8FACAPAACRBQAgGAAArQYAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhGgcAAI0FACAIAACJBcACIwwAAJAFACANAACPBQAgDwAAkQUAIP4BAQDoAwAhmgJAAOkDACGeAgAAigXBAiKfAkAA6QMAIawCAQDoAwAhrQIBAOgDACGwAgIAogQAIbcCAQCVBAAhuAIBAJUEACG5AgEAlQQAIboCAACIBQAguwIBAJUEACG8AgEAlQQAIb0CAgCiBAAhvgICAKIEACHCAgAAiwXCAiLDAggAjAUAIcQCAgDrAwAhxQICAKIEACHGAgEAlQQAIccCQADqAwAhBQQAAOQEACD-AQEAAAABnAIBAAAAAawCAQAAAAGxAgIAAAABAgAAAA8AIB8AAK4GACAaBwAAxgUAIAgAAADAAgMMAADJBQAgDgAAxwUAIA8AAMoFACD-AQEAAAABmgJAAAAAAZ4CAAAAwQICnwJAAAAAAawCAQAAAAGtAgEAAAABsAICAAAAAbcCAQAAAAG4AgEAAAABuQIBAAAAAboCAADFBQAguwIBAAAAAbwCAQAAAAG9AgIAAAABvgICAAAAAcICAAAAwgICwwIIAAAAAcQCAgAAAAHFAgIAAAABxgIBAAAAAccCQAAAAAECAAAAVAAgHwAAsAYAIAT-AQEAAAABpAIBAAAAAagCAQAAAAGpAgEAAAABBv4BAQAAAAGaAkAAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAQf-AQEAAAABlAIBAAAAAZwCAQAAAAGfAkAAAAABoQICAAAAAaICAgAAAAGjAiAAAAABAwAAAA0AIB8AAK4GACAgAAC3BgAgBwAAAA0AIAQAANYEACAYAAC3BgAg_gEBAOgDACGcAgEA6AMAIawCAQDoAwAhsQICAOsDACEFBAAA1gQAIP4BAQDoAwAhnAIBAOgDACGsAgEA6AMAIbECAgDrAwAhAwAAAFcAIB8AALAGACAgAAC6BgAgHAAAAFcAIAcAAI0FACAIAACJBcACIwwAAJAFACAOAACOBQAgDwAAkQUAIBgAALoGACD-AQEA6AMAIZoCQADpAwAhngIAAIoFwQIinwJAAOkDACGsAgEA6AMAIa0CAQDoAwAhsAICAKIEACG3AgEAlQQAIbgCAQCVBAAhuQIBAJUEACG6AgAAiAUAILsCAQCVBAAhvAIBAJUEACG9AgIAogQAIb4CAgCiBAAhwgIAAIsFwgIiwwIIAIwFACHEAgIA6wMAIcUCAgCiBAAhxgIBAJUEACHHAkAA6gMAIRoHAACNBQAgCAAAiQXAAiMMAACQBQAgDgAAjgUAIA8AAJEFACD-AQEA6AMAIZoCQADpAwAhngIAAIoFwQIinwJAAOkDACGsAgEA6AMAIa0CAQDoAwAhsAICAKIEACG3AgEAlQQAIbgCAQCVBAAhuQIBAJUEACG6AgAAiAUAILsCAQCVBAAhvAIBAJUEACG9AgIAogQAIb4CAgCiBAAhwgIAAIsFwgIiwwIIAIwFACHEAgIA6wMAIcUCAgCiBAAhxgIBAJUEACHHAkAA6gMAIQ4EAADMBAAgCAAAzQQAIAsAAM8EACAMAADQBAAg_gEBAAAAAZoCQAAAAAGcAgEAAAABqgIBAAAAAasCAgAAAAGsAgEAAAABrQIBAAAAAa4CAQAAAAGvAkAAAAABsAICAAAAAQIAAAATACAfAAC7BgAgAwAAABEAIB8AALsGACAgAAC_BgAgEAAAABEAIAQAAKMEACAIAACkBAAgCwAApgQAIAwAAKcEACAYAAC_BgAg_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACEOBAAAowQAIAgAAKQEACALAACmBAAgDAAApwQAIP4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIaoCAQCVBAAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhDgQAAMwEACAIAADNBAAgCgAAzgQAIAwAANAEACD-AQEAAAABmgJAAAAAAZwCAQAAAAGqAgEAAAABqwICAAAAAawCAQAAAAGtAgEAAAABrgIBAAAAAa8CQAAAAAGwAgIAAAABAgAAABMAIB8AAMAGACADAAAAEQAgHwAAwAYAICAAAMQGACAQAAAAEQAgBAAAowQAIAgAAKQEACAKAAClBAAgDAAApwQAIBgAAMQGACD-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGqAgEAlQQAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQ4EAACjBAAgCAAApAQAIAoAAKUEACAMAACnBAAg_gEBAOgDACGaAkAA6QMAIZwCAQDoAwAhqgIBAJUEACGrAgIA6wMAIawCAQDoAwAhrQIBAOgDACGuAgEAlQQAIa8CQADqAwAhsAICAKIEACEOBAAAzAQAIAgAAM0EACAKAADOBAAgCwAAzwQAIP4BAQAAAAGaAkAAAAABnAIBAAAAAaoCAQAAAAGrAgIAAAABrAIBAAAAAa0CAQAAAAGuAgEAAAABrwJAAAAAAbACAgAAAAECAAAAEwAgHwAAxQYAIBoHAADGBQAgCAAAAMACAw0AAMgFACAOAADHBQAgDwAAygUAIP4BAQAAAAGaAkAAAAABngIAAADBAgKfAkAAAAABrAIBAAAAAa0CAQAAAAGwAgIAAAABtwIBAAAAAbgCAQAAAAG5AgEAAAABugIAAMUFACC7AgEAAAABvAIBAAAAAb0CAgAAAAG-AgIAAAABwgIAAADCAgLDAggAAAABxAICAAAAAcUCAgAAAAHGAgEAAAABxwJAAAAAAQIAAABUACAfAADHBgAgDQ8AAIcGACAQAACIBgAgEQAAiQYAIBIAAIoGACD-AQEAAAABmgJAAAAAAZ8CQAAAAAHIAgEAAAAByQIBAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAc0CIAAAAAECAAAAAQAgHwAAyQYAIAMAAAARACAfAADFBgAgIAAAzQYAIBAAAAARACAEAACjBAAgCAAApAQAIAoAAKUEACALAACmBAAgGAAAzQYAIP4BAQDoAwAhmgJAAOkDACGcAgEA6AMAIaoCAQCVBAAhqwICAOsDACGsAgEA6AMAIa0CAQDoAwAhrgIBAJUEACGvAkAA6gMAIbACAgCiBAAhDgQAAKMEACAIAACkBAAgCgAApQQAIAsAAKYEACD-AQEA6AMAIZoCQADpAwAhnAIBAOgDACGqAgEAlQQAIasCAgDrAwAhrAIBAOgDACGtAgEA6AMAIa4CAQCVBAAhrwJAAOoDACGwAgIAogQAIQMAAABXACAfAADHBgAgIAAA0AYAIBwAAABXACAHAACNBQAgCAAAiQXAAiMNAACPBQAgDgAAjgUAIA8AAJEFACAYAADQBgAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACEaBwAAjQUAIAgAAIkFwAIjDQAAjwUAIA4AAI4FACAPAACRBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACEDAAAAPgAgHwAAyQYAICAAANMGACAPAAAAPgAgDwAA0wUAIBAAANQFACARAADVBQAgEgAA1gUAIBgAANMGACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHIAgEA6AMAIckCAQCVBAAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIgAPEDACENDwAA0wUAIBAAANQFACARAADVBQAgEgAA1gUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIcgCAQDoAwAhyQIBAJUEACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAiAA8QMAIRoHAADGBQAgCAAAAMACAwwAAMkFACANAADIBQAgDgAAxwUAIP4BAQAAAAGaAkAAAAABngIAAADBAgKfAkAAAAABrAIBAAAAAa0CAQAAAAGwAgIAAAABtwIBAAAAAbgCAQAAAAG5AgEAAAABugIAAMUFACC7AgEAAAABvAIBAAAAAb0CAgAAAAG-AgIAAAABwgIAAADCAgLDAggAAAABxAICAAAAAcUCAgAAAAHGAgEAAAABxwJAAAAAAQIAAABUACAfAADUBgAgDQwAAIYGACAQAACIBgAgEQAAiQYAIBIAAIoGACD-AQEAAAABmgJAAAAAAZ8CQAAAAAHIAgEAAAAByQIBAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAc0CIAAAAAECAAAAAQAgHwAA1gYAIAMAAABXACAfAADUBgAgIAAA2gYAIBwAAABXACAHAACNBQAgCAAAiQXAAiMMAACQBQAgDQAAjwUAIA4AAI4FACAYAADaBgAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACEaBwAAjQUAIAgAAIkFwAIjDAAAkAUAIA0AAI8FACAOAACOBQAg_gEBAOgDACGaAkAA6QMAIZ4CAACKBcECIp8CQADpAwAhrAIBAOgDACGtAgEA6AMAIbACAgCiBAAhtwIBAJUEACG4AgEAlQQAIbkCAQCVBAAhugIAAIgFACC7AgEAlQQAIbwCAQCVBAAhvQICAKIEACG-AgIAogQAIcICAACLBcICIsMCCACMBQAhxAICAOsDACHFAgIAogQAIcYCAQCVBAAhxwJAAOoDACEDAAAAPgAgHwAA1gYAICAAAN0GACAPAAAAPgAgDAAA0gUAIBAAANQFACARAADVBQAgEgAA1gUAIBgAAN0GACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHIAgEA6AMAIckCAQCVBAAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIgAPEDACENDAAA0gUAIBAAANQFACARAADVBQAgEgAA1gUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIcgCAQDoAwAhyQIBAJUEACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAiAA8QMAIQ0MAACGBgAgDwAAhwYAIBEAAIkGACASAACKBgAg_gEBAAAAAZoCQAAAAAGfAkAAAAAByAIBAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAiAAAAABAgAAAAEAIB8AAN4GACADAAAAPgAgHwAA3gYAICAAAOIGACAPAAAAPgAgDAAA0gUAIA8AANMFACARAADVBQAgEgAA1gUAIBgAAOIGACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHIAgEA6AMAIckCAQCVBAAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIgAPEDACENDAAA0gUAIA8AANMFACARAADVBQAgEgAA1gUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIcgCAQDoAwAhyQIBAJUEACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAiAA8QMAIQ0MAACGBgAgDwAAhwYAIBAAAIgGACASAACKBgAg_gEBAAAAAZoCQAAAAAGfAkAAAAAByAIBAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAiAAAAABAgAAAAEAIB8AAOMGACADAAAAPgAgHwAA4wYAICAAAOcGACAPAAAAPgAgDAAA0gUAIA8AANMFACAQAADUBQAgEgAA1gUAIBgAAOcGACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHIAgEA6AMAIckCAQCVBAAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIgAPEDACENDAAA0gUAIA8AANMFACAQAADUBQAgEgAA1gUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIcgCAQDoAwAhyQIBAJUEACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAiAA8QMAIQ0MAACGBgAgDwAAhwYAIBAAAIgGACARAACJBgAg_gEBAAAAAZoCQAAAAAGfAkAAAAAByAIBAAAAAckCAQAAAAHKAgEAAAABywIBAAAAAcwCAQAAAAHNAiAAAAABAgAAAAEAIB8AAOgGACADAAAAPgAgHwAA6AYAICAAAOwGACAPAAAAPgAgDAAA0gUAIA8AANMFACAQAADUBQAgEQAA1QUAIBgAAOwGACD-AQEA6AMAIZoCQADpAwAhnwJAAOkDACHIAgEA6AMAIckCAQCVBAAhygIBAJUEACHLAgEAlQQAIcwCAQCVBAAhzQIgAPEDACENDAAA0gUAIA8AANMFACAQAADUBQAgEQAA1QUAIP4BAQDoAwAhmgJAAOkDACGfAkAA6QMAIcgCAQDoAwAhyQIBAJUEACHKAgEAlQQAIcsCAQCVBAAhzAIBAJUEACHNAiAA8QMAIQYFABIMBgIPLg0QMg8RNhASOBEDAwABBAADCQAIBgUADgcKBAwkAg0jCA4QBw8oDQIEAAMGAAUCBAsEBQAGAQQMAAMEAAMFAAwNFAgGBAADBQALCBUHChkJCx0KDB4CAQkACAEJAAgDCh8ACyAADCEAAQ0iAAIDAAEEAAMFBykADCwADSsADioADy0AAQMAAQEDAAEBAwABBAw5AA86ABA7ABE8AAAAAAMFABclABgmABkAAAADBQAXJQAYJgAZAAAFBQAeJQAhJgAiNwAfOAAgAAAAAAAFBQAeJQAhJgAiNwAfOAAgAAAFBQAnJQAqJgArNwAoOAApAAAAAAAFBQAnJQAqJgArNwAoOAApAgQAAwYABQIEAAMGAAUFBQAwJQAzJgA0NwAxOAAyAAAAAAAFBQAwJQAzJgA0NwAxOAAyAQQAAwEEAAMFBQA5JQA8JgA9NwA6OAA7AAAAAAAFBQA5JQA8JgA9NwA6OAA7AgQAAwi8AQcCBAADCMIBBwUFAEIlAEUmAEY3AEM4AEQAAAAAAAUFAEIlAEUmAEY3AEM4AEQBCQAIAQkACAMFAEslAEwmAE0AAAADBQBLJQBMJgBNAQkACAEJAAgDBQBSJQBTJgBUAAAAAwUAUiUAUyYAVAMDAAEEAAMJAAgDAwABBAADCQAIBQUAWSUAXCYAXTcAWjgAWwAAAAAABQUAWSUAXCYAXTcAWjgAWwIDAAEEAAMCAwABBAADAwUAYiUAYyYAZAAAAAMFAGIlAGMmAGQBAwABAQMAAQMFAGklAGomAGsAAAADBQBpJQBqJgBrAQMAAQEDAAEDBQBwJQBxJgByAAAAAwUAcCUAcSYAcgEDAAEBAwABAwUAdyUAeCYAeQAAAAMFAHclAHgmAHkAAAAFBQB_JQCCASYAgwE3AIABOACBAQAAAAAABQUAfyUAggEmAIMBNwCAATgAgQETAgEUPQEVQAEWQQEXQgEZRAEaRhMbRxQcSQEdSxMeTBUhTQEiTgEjTxMnUhYoUxopVQMqVgMrWQMsWgMtWwMuXQMvXxMwYBsxYgMyZBMzZRw0ZgM1ZwM2aBM5ax06bCM7bgU8bwU9cgU-cwU_dAVAdgVBeBNCeSRDewVEfRNFfiVGfwVHgAEFSIEBE0mEASZKhQEsS4YBBEyHAQRNiAEETokBBE-KAQRQjAEEUY4BE1KPAS1TkQEEVJMBE1WUAS5WlQEEV5YBBFiXARNZmgEvWpsBNVucAQdcnQEHXZ4BB16fAQdfoAEHYKIBB2GkARNipQE2Y6cBB2SpARNlqgE3ZqsBB2esAQdorQETabABOGqxAT5rsgEIbLMBCG20AQhutQEIb7YBCHC4AQhxugETcrsBP3O-AQh0wAETdcEBQHbDAQh3xAEIeMUBE3nIAUF6yQFHe8oBCXzLAQl9zAEJfs0BCX_OAQmAAdABCYEB0gETggHTAUiDAdUBCYQB1wEThQHYAUmGAdkBCYcB2gEJiAHbAROJAd4BSooB3wFOiwHgAQqMAeEBCo0B4gEKjgHjAQqPAeQBCpAB5gEKkQHoAROSAekBT5MB6wEKlAHtAROVAe4BUJYB7wEKlwHwAQqYAfEBE5kB9AFRmgH1AVWbAfYBApwB9wECnQH4AQKeAfkBAp8B-gECoAH8AQKhAf4BE6IB_wFWowGBAgKkAYMCE6UBhAJXpgGFAgKnAYYCAqgBhwITqQGKAliqAYsCXqsBjAINrAGNAg2tAY4CDa4BjwINrwGQAg2wAZICDbEBlAITsgGVAl-zAZcCDbQBmQITtQGaAmC2AZsCDbcBnAINuAGdAhO5AaACYboBoQJluwGiAg-8AaMCD70BpAIPvgGlAg-_AaYCD8ABqAIPwQGqAhPCAasCZsMBrQIPxAGvAhPFAbACZ8YBsQIPxwGyAg_IAbMCE8kBtgJoygG3AmzLAbgCEMwBuQIQzQG6AhDOAbsCEM8BvAIQ0AG-AhDRAcACE9IBwQJt0wHDAhDUAcUCE9UBxgJu1gHHAhDXAcgCENgByQIT2QHMAm_aAc0Cc9sBzwIR3AHQAhHdAdICEd4B0wIR3wHUAhHgAdYCEeEB2AIT4gHZAnTjAdsCEeQB3QIT5QHeAnXmAd8CEecB4AIR6AHhAhPpAeQCduoB5QJ66wHnAnvsAegCe-0B6wJ77gHsAnvvAe0Ce_AB7wJ78QHxAhPyAfICfPMB9AJ79AH2AhP1AfcCffYB-AJ79wH5Anv4AfoCE_kB_QJ--gH-AoQB"
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
    select: { id: true, externalId: true, status: true, _count: { select: { episodes: true } }, episodeCount: true }
  });
  for (const a of list) {
    if (expired(opts)) break;
    const complete = a.status === "FINISHED" && a.episodeCount != null && a._count.episodes >= a.episodeCount;
    if (complete) continue;
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
        if (found) await db.episode.update({ where: { id: found.id }, data });
        else {
          await db.episode.create({ data: { ...data, animeId: a.id, seasonId, episodeNumber: e.episodeNumber } });
          stats.episodesAdded++;
        }
      }
    } catch (err) {
      stats.errors.push(`syncEpisodes ${a.externalId}: ${err.message}`);
    }
  }
  return stats;
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
  const [today, week, month, recentlyAdded, recentlyUpdated, upcoming] = await Promise.all([
    q({ startDate: { gte: startOfDay, lt: new Date(startOfDay.getTime() + day2) } }, { startDate: "desc" }),
    q({ startDate: { gte: weekAgo, lte: now } }, { startDate: "desc" }),
    q({ startDate: { gte: monthAgo, lte: now } }, { startDate: "desc" }),
    q({}, { createdAt: "desc" }),
    q({}, { updatedAt: "desc" }),
    q({ OR: [{ status: "UPCOMING" }, { startDate: { gt: now } }] }, { startDate: "asc" })
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
  const [hero, recentlyAdded, trending, popularSeason, airing, fresh, recentlyUpdated, latest, recommended, cont, genres] = await Promise.all([
    take({ rating: { sort: "desc", nulls: "last" } }, { status: "AIRING", bannerImage: { not: null } }, 5),
    take({ createdAt: "desc" }),
    take({ popularity: "desc" }),
    take({ popularity: "desc" }, { status: "AIRING" }),
    take({ startDate: "desc" }, { status: "AIRING" }),
    take({ startDate: { sort: "desc", nulls: "last" } }, { status: { in: ["AIRING", "UPCOMING"] } }),
    take({ updatedAt: "desc" }),
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
