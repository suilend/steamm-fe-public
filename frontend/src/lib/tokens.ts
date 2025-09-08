import { Token } from "@/contexts/MarketContext";

export const getFilteredTokens = (
  tokens: Token[],
  searchString: string,
): Token[] => {
  if (searchString === "") return tokens;

  const lowerSearchString = searchString.toLowerCase();

  return tokens.filter((token) =>
    [token.id, token.name, token.symbol, token.coinType, token.description]
      .join("____")
      .toLowerCase()
      .includes(lowerSearchString),
  );
};

export const isInvalidIconUrl = (url: string | null): boolean => {
  if (!url) return true;

  // Check for common invalid URL patterns
  const invalidPatterns = [
    /^https?:\/\/[^\/]*\/?$/, // Domain only URLs
    /\.(gif|png|jpg|jpeg|webp|svg)$/i, // Valid image extensions (return false)
  ];

  // If it has a valid image extension, it's valid
  if (invalidPatterns[1].test(url)) return false;

  // If it's just a domain, it's invalid
  if (invalidPatterns[0].test(url)) return true;

  return false;
};
