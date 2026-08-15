import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import MapPin from 'lucide-react-native/icons/map-pin';
import MapPinned from 'lucide-react-native/icons/map-pinned';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components';
import { colors, radii, spacing, typography } from '../../../theme/tokens';

export type FacilityLocationValue = {
  latitude: string;
  longitude: string;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Props = {
  value: FacilityLocationValue;
  onChange: (value: FacilityLocationValue) => void;
  onBlur?: () => void;
  errorText?: string;
};

const AMMAN_CENTER: Coordinate = {
  latitude: 31.9539,
  longitude: 35.9106,
};

const MAP_DELTA = {
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export function FacilityLocationField({
  value,
  onChange,
  onBlur,
  errorText,
}: Props): React.JSX.Element {
  const mapRef = useRef<MapView>(null);
  const selectedCoordinate = useMemo(() => toCoordinate(value), [value]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draftCoordinate, setDraftCoordinate] = useState<Coordinate>(
    selectedCoordinate ?? AMMAN_CENTER,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>();

  const openPicker = () => {
    setDraftCoordinate(selectedCoordinate ?? AMMAN_CENTER);
    setLocationError(undefined);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setLocationError(undefined);
  };

  const confirmLocation = () => {
    onChange({
      latitude: draftCoordinate.latitude.toFixed(6),
      longitude: draftCoordinate.longitude.toFixed(6),
    });
    onBlur?.();
    closePicker();
  };

  const chooseMapPoint = (event: MapPressEvent) => {
    setDraftCoordinate(event.nativeEvent.coordinate);
    setLocationError(undefined);
  };

  const centerNearMe = async () => {
    setLocating(true);
    setLocationError(undefined);
    try {
      const { default: Geolocation } = await import(
        '@react-native-community/geolocation'
      );
      const allowed = await requestPermission(Geolocation);
      if (!allowed) {
        setLocationError(
          'Location permission was not granted. You can still tap the map to place the facility pin.',
        );
        return;
      }
      const coordinates = await currentCoordinates(Geolocation);
      const nextCoordinate = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
      setDraftCoordinate(nextCoordinate);
      mapRef.current?.animateToRegion(toRegion(nextCoordinate), 350);
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : 'Your current location could not be read. You can still choose the facility on the map.',
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={styles.label}>Exact facility location</Text>
        <Text style={styles.help}>
          Place a pin on the facility entrance so players can find it easily.
        </Text>
      </View>

      {selectedCoordinate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change facility location on map"
          onPress={openPicker}
          style={({ pressed }) => [
            styles.selectedCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.previewMap} pointerEvents="none">
            <MapView
              initialRegion={toRegion(selectedCoordinate)}
              mapType="standard"
              pitchEnabled={false}
              rotateEnabled={false}
              scrollEnabled={false}
              toolbarEnabled={false}
              zoomEnabled={false}
              style={StyleSheet.absoluteFill}
            >
              <Marker coordinate={selectedCoordinate} pinColor={colors.brand} />
            </MapView>
          </View>
          <View style={styles.selectedCopy}>
            <View style={styles.selectedTitleRow}>
              <MapPinned color={colors.brand} size={21} strokeWidth={1.9} />
              <Text style={styles.selectedTitle}>Facility pin selected</Text>
            </View>
            <Text style={styles.selectedHelp}>
              Tap to review or change the location.
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <MapPin color={colors.brand} size={24} strokeWidth={1.8} />
          </View>
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>No map location selected</Text>
            <Text style={styles.emptyHelp}>
              Your latitude and longitude will be saved automatically.
            </Text>
          </View>
          <AppButton
            label="Choose on map"
            onPress={openPicker}
            variant="brandOutline"
          />
        </View>
      )}

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Modal
        animationType="slide"
        onRequestClose={closePicker}
        presentationStyle="fullScreen"
        visible={pickerVisible}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeadingCopy}>
              <Text style={styles.modalTitle}>Choose facility location</Text>
              <Text style={styles.modalHelp}>
                Tap the facility building, then drag the pin for exact placement.
              </Text>
            </View>
            <AppButton label="Cancel" onPress={closePicker} variant="ghost" />
          </View>

          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              accessibilityLabel="Facility location map"
              initialRegion={toRegion(draftCoordinate)}
              loadingEnabled
              mapType="standard"
              onPress={chooseMapPoint}
              showsCompass
              showsMyLocationButton={false}
              style={StyleSheet.absoluteFill}
              testID="facility-location-map"
              toolbarEnabled={false}
            >
              <Marker
                coordinate={draftCoordinate}
                draggable
                onDragEnd={event => {
                  setDraftCoordinate(event.nativeEvent.coordinate);
                  setLocationError(undefined);
                }}
                pinColor={colors.brand}
                title="Facility"
              />
            </MapView>

            <View pointerEvents="box-none" style={styles.mapActions}>
              <AppButton
                label="Center near me"
                onPress={centerNearMe}
                disabled={locating}
                loading={locating}
                variant="secondary"
                icon={
                  <LocateFixed
                    color={colors.brand}
                    size={19}
                    strokeWidth={1.8}
                  />
                }
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            {locationError ? (
              <Text style={styles.error}>{locationError}</Text>
            ) : null}
            <Text style={styles.savedAutomatically}>
              The map pin is converted to exact coordinates automatically.
            </Text>
            <AppButton
              label="Confirm location"
              onPress={confirmLocation}
              variant="brand"
              size="large"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

type GeolocationApi = typeof import('@react-native-community/geolocation').default;

async function requestPermission(
  Geolocation: GeolocationApi,
): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return new Promise(resolve => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  }
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Center the facility map near you',
      message:
        'PlayLobby uses your location only when you ask to center the facility map near you.',
      buttonPositive: 'Center map',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function currentCoordinates(
  Geolocation: GeolocationApi,
): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(position.coords),
      error =>
        reject(
          new Error(
            error.message ||
              'Your current location could not be read. Choose the facility directly on the map.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 },
    );
  });
}

function toCoordinate(value: FacilityLocationValue): Coordinate | undefined {
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (
    !value.latitude ||
    !value.longitude ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }
  return { latitude, longitude };
}

function toRegion(coordinate: Coordinate): Region {
  return {
    ...coordinate,
    ...MAP_DELTA,
  };
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  copy: { gap: spacing.xs },
  label: { ...typography.button, color: colors.text },
  help: { ...typography.caption, color: colors.muted },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyCopy: { flex: 1, gap: spacing.xs, minWidth: 180 },
  emptyTitle: { ...typography.button, color: colors.text },
  emptyHelp: { ...typography.caption, color: colors.muted },
  selectedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.brandBorder,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewMap: { height: 144 },
  selectedCopy: { gap: spacing.xs, padding: spacing.md },
  selectedTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectedTitle: { ...typography.button, color: colors.text },
  selectedHelp: { ...typography.caption, color: colors.muted },
  pressed: { opacity: 0.76 },
  error: { ...typography.caption, color: colors.danger },
  modalScreen: { backgroundColor: colors.surface, flex: 1 },
  modalHeader: {
    alignItems: 'flex-start',
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalHeadingCopy: { flex: 1, gap: spacing.xs },
  modalTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  modalHelp: { ...typography.caption, color: colors.muted },
  mapWrap: { flex: 1, minHeight: 320 },
  mapActions: {
    alignItems: 'flex-end',
    bottom: spacing.lg,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  modalFooter: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  savedAutomatically: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
});
