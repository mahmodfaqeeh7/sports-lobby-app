import React from 'react';
import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import {MapPin} from 'lucide-react-native';
import {reachableBackendUrl} from '../../../config/environment';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {Lobby} from '../api';

type LobbyDetailsHeroProps = {
  lobby: Lobby;
};

export function LobbyDetailsHero({lobby}: LobbyDetailsHeroProps): React.JSX.Element {
  const content = (
    <>
      {lobby.courtImageUrl ? <View style={styles.overlay} /> : null}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{lobby.sportName || 'Sports lobby'}</Text>
          <View style={styles.status}>
            <Text style={styles.statusText}>{lobby.status}</Text>
          </View>
        </View>
        <View style={styles.venueRow}>
          <MapPin color={colors.surface} size={18} />
          <Text style={styles.venue}>{lobby.venueName || lobby.courtName}</Text>
        </View>
        {lobby.description ? (
          <Text numberOfLines={2} style={styles.description}>
            {lobby.description}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (!lobby.courtImageUrl) {
    return <View style={[styles.hero, styles.fallback]}>{content}</View>;
  }

  return (
    <ImageBackground
      accessibilityLabel={`${lobby.courtName || lobby.sportName} court`}
      imageStyle={styles.image}
      source={{uri: reachableBackendUrl(lobby.courtImageUrl)}}
      style={styles.hero}>
      {content}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    minHeight: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    borderRadius: radii.lg,
  },
  fallback: {
    backgroundColor: colors.accent,
  },
  overlay: {
    backgroundColor: colors.heroOverlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'flex-end',
    padding: spacing.xl,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.surface,
    flexShrink: 1,
  },
  status: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.brandPressed,
  },
  venueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  venue: {
    ...typography.sectionTitle,
    color: colors.surface,
    flex: 1,
  },
  description: {
    ...typography.body,
    color: colors.surface,
  },
});
