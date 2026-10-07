import { env } from "../lib/env.js";
import { JikanMetadataProvider } from "./jikan/jikanProvider.js";
import { LibrarySubtitleProvider, LibraryVideoProvider } from "./library/libraryProviders.js";
import { MockMetadataProvider, MockSubtitleProvider, MockVideoProvider } from "./mock/mockProviders.js";
import type { MetadataProvider, SubtitleProvider, VideoProvider } from "./types.js";

/**
 * Provider adapter layer. Routes and services only depend on the interfaces in ./types;
 * adding an authorized provider means adding a class here and a case below.
 */
export function getMetadataProvider(): MetadataProvider {
  switch (env.metadataProvider) {
    case "jikan":
      return new JikanMetadataProvider();
    default:
      return new MockMetadataProvider();
  }
}

export function getVideoProvider(): VideoProvider {
  return env.videoProvider === "library" ? new LibraryVideoProvider() : new MockVideoProvider();
}

export function getSubtitleProvider(): SubtitleProvider {
  return env.videoProvider === "library" ? new LibrarySubtitleProvider() : new MockSubtitleProvider();
}
