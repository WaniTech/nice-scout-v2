exports.matchPlayerToClubs = async (playerProfile, opportunities) => {
  const position = String(playerProfile.position || '').toLowerCase();
  const strengths = Array.isArray(playerProfile.strengths) ? playerProfile.strengths : [];

  return opportunities
    .map((opportunity) => {
      const positionMatch =
        opportunity.position.toLowerCase().includes(position) ||
        position.includes(opportunity.position.toLowerCase());
      const searchableText = [
        opportunity.description,
        opportunity.position,
        opportunity.tags.join(' '),
        opportunity.requirements.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      const strengthMatches = strengths.filter((strength) =>
        searchableText.includes(String(strength).toLowerCase()),
      );

      return {
        ...opportunity,
        score: opportunity.fit + (positionMatch ? 4 : 0) + strengthMatches.length,
        reasons: [
          positionMatch ? 'Position fit' : null,
          ...strengthMatches.map((strength) => `Strength match: ${strength}`),
        ].filter(Boolean),
      };
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 4);
};
