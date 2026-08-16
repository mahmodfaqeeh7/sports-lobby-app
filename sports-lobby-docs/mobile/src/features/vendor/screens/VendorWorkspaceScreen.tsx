import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {
  AppButton,
  AppScreen,
  AppTextField,
  Badge,
  EmptyState,
  FormSection,
  LobbyCard,
  Notice,
  PhoneFieldValue,
  PhoneNumberField,
  SegmentTabs,
  VenueCard,
  toE164,
} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {showError} from '../../auth/utils/authErrors';
import {reachableBackendUrl} from '../../../config/environment';
import {CourtImageField} from '../../courts/components/CourtImageField';
import {pickCourtImage, SelectedCourtImage, uploadCourtImage} from '../../courts/courtImage';
import {Court, Lobby, SaveLobbyRequest, courtsApi, lobbiesApi} from '../../lobbies/api';
import {Sport, sportsApi} from '../../sports/api';
import {Venue, venuesApi} from '../../venues/api';
import {Vendor, VendorKyc, vendorApi} from '../api';
import {VendorKycStatusPanel} from '../components/VendorKycStatusPanel';
import {
  FacilityLocationField,
  FacilityLocationValue,
} from '../../vendor-onboarding/components/FacilityLocationField';

type VendorWorkspaceScreenProps = {
  session: AuthenticatedSession;
};

export function VendorWorkspaceScreen({session}: VendorWorkspaceScreenProps): React.JSX.Element {
  const [tab, setTab] = useState('venues');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{title?: string; message?: string; tone?: 'info' | 'success' | 'error' | 'warning'}>({});
  const [vendor, setVendor] = useState<Vendor>();
  const [kyc, setKyc] = useState<VendorKyc>();
  const [sports, setSports] = useState<Sport[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');
  const [selectedLobbyId, setSelectedLobbyId] = useState('');

  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [contactPhone, setContactPhone] = useState<PhoneFieldValue>({countryCode: '+962', nationalNumber: ''});
  const [venueLocation, setVenueLocation] = useState<FacilityLocationValue>({latitude: '', longitude: ''});
  const [courtName, setCourtName] = useState('Court 1');
  const [courtImage, setCourtImage] = useState<SelectedCourtImage>();
  const [courtImageProgress, setCourtImageProgress] = useState(0);
  const [minPlayers, setMinPlayers] = useState('8');
  const [maxPlayers, setMaxPlayers] = useState('12');
  const [priceAmount, setPriceAmount] = useState('5.00');
  const [pricingModel, setPricingModel] = useState<'PRICE_PER_PLAYER' | 'TOTAL_COURT_PRICE'>('PRICE_PER_PLAYER');
  const [description, setDescription] = useState('Open lobby for local players.');

  const approved = vendor?.verificationStatus === 'APPROVED';
  const selectedCourt = useMemo(
    () => courts.find(court => court.id === selectedCourtId),
    [courts, selectedCourtId],
  );
  const lobbySports = useMemo(
    () => sports.filter(sport => selectedCourt?.sportIds.includes(sport.id)),
    [selectedCourt?.sportIds, sports],
  );

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [nextKyc, nextSports, nextVenues, nextLobbies] = await Promise.all([
        vendorApi.kyc(apiClient, session.tokens.accessToken),
        sportsApi.list(apiClient),
        venuesApi.listMine(apiClient, session.tokens.accessToken),
        lobbiesApi.listMine(apiClient, session.tokens.accessToken),
      ]);
      setKyc(nextKyc);
      setVendor(nextKyc.vendor);
      setSports(nextSports);
      setVenues(nextVenues);
      setLobbies(nextLobbies);
      const venueId = nextVenues[0]?.id || '';
      const sportId = nextSports[0]?.id || '';
      setSelectedVenueId(venueId);
      setSelectedSportId(sportId);
      setSelectedLobbyId(nextLobbies[0]?.id || '');
      if (venueId) {
        const nextCourts = await courtsApi.list(apiClient, session.tokens.accessToken, venueId);
        setCourts(nextCourts);
        const court = nextCourts[0];
        setSelectedCourtId(court?.id ?? '');
        setSelectedSportId(court?.sportIds[0] ?? sportId);
      }
      setNotice({});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  }, [session.tokens.accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedCourt && !selectedCourt.sportIds.includes(selectedSportId)) {
      setSelectedSportId(selectedCourt.sportIds[0] ?? '');
    }
  }, [selectedCourt, selectedSportId]);

  const createVenue = async () => {
    setBusy(true);
    try {
      if (!venueName.trim() || !city.trim() || !addressLine.trim() || !contactPhone.nationalNumber.trim()) {
        throw new Error('Add the venue name, city, address, and contact phone.');
      }
      if (!venueLocation.latitude.trim() || !venueLocation.longitude.trim()) {
        throw new Error('Choose the venue location on the map.');
      }
      const latitude = Number(venueLocation.latitude);
      const longitude = Number(venueLocation.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('Choose a valid venue location on the map.');
      }
      const created = await venuesApi.create(apiClient, session.tokens.accessToken, {
        name: venueName,
        description: 'Sports venue managed from mobile.',
        countryCode: 'JO',
        city,
        area,
        addressLine,
        latitude,
        longitude,
        timezone: 'Asia/Amman',
        contactPhone: toE164(contactPhone.countryCode, contactPhone.nationalNumber),
      });
      setVenues(current => [created, ...current]);
      setSelectedVenueId(created.id);
      setVenueName('');
      setCity('');
      setArea('');
      setAddressLine('');
      setContactPhone({countryCode: '+962', nationalNumber: ''});
      setVenueLocation({latitude: '', longitude: ''});
      setNotice({title: 'Venue created', message: 'Add courts before creating lobbies for players.', tone: 'success'});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const createCourt = async () => {
    setBusy(true);
    try {
      if (!selectedVenueId || !selectedSportId) {
        throw new Error('Select a venue and sport first.');
      }
      if (!courtImage) {
        throw new Error('Choose a clear photo of the court.');
      }
      const upload = await courtsApi.createImageUpload(apiClient, session.tokens.accessToken, {
        fileName: courtImage.name,
        contentType: courtImage.contentType,
        sizeBytes: courtImage.sizeBytes,
      });
      await uploadCourtImage(courtImage, upload, setCourtImageProgress);
      await courtsApi.completeImageUpload(apiClient, session.tokens.accessToken, upload.fileId);
      const created = await courtsApi.create(apiClient, session.tokens.accessToken, selectedVenueId, {
        name: courtName,
        description: 'Bookable court.',
        defaultMinPlayers: toPositiveInt(minPlayers),
        defaultMaxPlayers: toPositiveInt(maxPlayers),
        imageFileId: upload.fileId,
        sportIds: [selectedSportId],
      });
      setCourts(current => [created, ...current]);
      setSelectedCourtId(created.id);
      setSelectedSportId(created.sportIds[0] ?? selectedSportId);
      setCourtImage(undefined);
      setCourtImageProgress(0);
      setNotice({title: 'Court created', message: 'You can now create a lobby for this court.', tone: 'success'});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const chooseCourtImage = async () => {
    try {
      const selected = await pickCourtImage();
      if (selected) {
        setCourtImage(selected);
        setCourtImageProgress(0);
      }
    } catch (error) {
      showError(error, setNotice);
    }
  };

  const createOrEditLobby = async (mode: 'create' | 'edit') => {
    setBusy(true);
    try {
      const court = courts.find(item => item.id === selectedCourtId);
      if (!court) {
        throw new Error('Select a court first.');
      }
      if (!court.sportIds.includes(selectedSportId)) {
        throw new Error('Select a sport supported by this court.');
      }
      const request = buildLobbyRequest(selectedVenueId, selectedCourtId, selectedSportId, {
        minPlayers,
        maxPlayers,
        pricingModel,
        priceAmount,
        description,
      });
      const lobby =
        mode === 'create'
          ? await lobbiesApi.create(apiClient, session.tokens.accessToken, request)
          : await lobbiesApi.editDraft(apiClient, session.tokens.accessToken, selectedLobbyId, request);
      setLobbies(current => (mode === 'create' ? [lobby, ...current] : current.map(item => (item.id === lobby.id ? lobby : item))));
      setSelectedLobbyId(lobby.id);
      setNotice({title: mode === 'create' ? 'Lobby draft created' : 'Lobby draft updated', message: 'Publish it once your vendor profile is approved.', tone: 'success'});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const publishLobby = async (lobbyId: string) => {
    setBusy(true);
    try {
      const published = await lobbiesApi.publish(apiClient, session.tokens.accessToken, lobbyId);
      setLobbies(current => current.map(item => (item.id === published.id ? published : item)));
      setNotice({title: 'Lobby published', message: 'Players can now discover and reserve seats.', tone: 'success'});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  if (!session.user.roles.includes('VENDOR')) {
    return (
      <AppScreen title="Vendor" subtitle="Vendor tools are available after vendor verification signup.">
        <Notice
          title="Vendor account required"
          message="Create a vendor profile from the signup screen to manage venues, courts, and lobbies."
          tone="warning"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="Vendor Workspace"
      subtitle="Set up venues, courts, and games for players."
      action={vendor ? <Badge label={vendor.verificationStatus} tone={approved ? 'success' : 'warning'} /> : undefined}>
      <Notice title={notice.title} message={notice.message} tone={notice.tone} onDismiss={() => setNotice({})} />
      {kyc ? (
        <VendorKycStatusPanel
          kyc={kyc}
          accessToken={session.tokens.accessToken}
          onRefresh={load}
        />
      ) : null}
      {vendor && !approved ? (
        <Notice
          title="Publishing locked"
          message="You can prepare venues, courts, and draft lobbies now. Publishing unlocks after approval."
          tone="warning"
        />
      ) : null}
      <SegmentTabs
        items={[
          {key: 'venues', label: 'Venues'},
          {key: 'courts', label: 'Courts'},
          {key: 'lobbies', label: 'Lobbies'},
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'venues' ? renderVenues() : null}
      {tab === 'courts' ? renderCourts() : null}
      {tab === 'lobbies' ? renderLobbies() : null}
    </AppScreen>
  );

  function renderVenues(): React.JSX.Element {
    return (
      <View style={styles.stack}>
        <FormSection title="Add Venue" subtitle="Each venue has its own address and exact map pin.">
          <AppTextField label="Venue name" value={venueName} onChangeText={setVenueName} />
          <AppTextField label="City" value={city} onChangeText={setCity} />
          <AppTextField label="Area" value={area} onChangeText={setArea} />
          <AppTextField label="Address" value={addressLine} onChangeText={setAddressLine} />
          <FacilityLocationField value={venueLocation} onChange={setVenueLocation} />
          <PhoneNumberField
            label="Contact phone"
            countryCode={contactPhone.countryCode}
            nationalNumber={contactPhone.nationalNumber}
            onChangeCountryCode={countryCode => setContactPhone(current => ({...current, countryCode}))}
            onChangeNationalNumber={nationalNumber => setContactPhone(current => ({...current, nationalNumber}))}
          />
          <AppButton label="Create venue" onPress={createVenue} disabled={busy} />
        </FormSection>
        {venues.length === 0 ? (
          <EmptyState title="No venues yet" message="Add your first venue to start setting up courts." />
        ) : (
          venues.map(venue => (
            <Pressable key={venue.id} onPress={() => setSelectedVenueId(venue.id)}>
              <VenueCard venue={venue} />
            </Pressable>
          ))
        )}
      </View>
    );
  }

  function renderCourts(): React.JSX.Element {
    return (
      <View style={styles.stack}>
        <FormSection title="Add Court" subtitle="Choose the venue and sport this court supports.">
          <ChoiceList
            items={venues.map(venue => ({id: venue.id, label: venue.name}))}
            selectedId={selectedVenueId}
            onSelect={async id => {
              setSelectedVenueId(id);
              const nextCourts = await courtsApi.list(apiClient, session.tokens.accessToken, id);
              setCourts(nextCourts);
              const firstCourt = nextCourts[0];
              setSelectedCourtId(firstCourt?.id ?? '');
              setSelectedSportId(firstCourt?.sportIds[0] ?? selectedSportId);
            }}
            empty="Add a venue first."
          />
          <SegmentTabs
            items={sports.map(sport => ({key: sport.id, label: sport.name}))}
            value={selectedSportId}
            onChange={setSelectedSportId}
          />
          <AppTextField label="Court name" value={courtName} onChangeText={setCourtName} />
          <CourtImageField
            value={courtImage}
            disabled={busy}
            progress={courtImageProgress}
            onPick={chooseCourtImage}
            onRemove={() => {
              setCourtImage(undefined);
              setCourtImageProgress(0);
            }}
          />
          <View style={styles.twoColumns}>
            <AppTextField label="Min players" value={minPlayers} onChangeText={setMinPlayers} keyboardType="number-pad" />
            <AppTextField label="Max players" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />
          </View>
          <AppButton label="Create court" onPress={createCourt} disabled={busy || !selectedVenueId} />
        </FormSection>
        {courts.length === 0 ? (
          <EmptyState title="No courts yet" message="Add a court for the selected venue." />
        ) : (
          courts.map(court => (
            <Pressable
              key={court.id}
              onPress={() => {
                setSelectedCourtId(court.id);
                setSelectedSportId(court.sportIds[0] ?? selectedSportId);
              }}
              style={[styles.choice, selectedCourtId === court.id && styles.choiceSelected]}>
              {court.imageUrl ? (
                <Image
                  source={{uri: reachableBackendUrl(court.imageUrl)}}
                  style={styles.courtImage}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.choiceTitle}>{court.name}</Text>
              <Text style={styles.choiceMeta}>{court.status} - {court.sportIds.map(sportName).join(', ')}</Text>
            </Pressable>
          ))
        )}
      </View>
    );
  }

  function renderLobbies(): React.JSX.Element {
    return (
      <View style={styles.stack}>
        <FormSection title="Create Lobby" subtitle="Set capacity, price, and timing before publishing.">
          <ChoiceList
            items={venues.map(venue => ({id: venue.id, label: venue.name}))}
            selectedId={selectedVenueId}
            onSelect={async id => {
              setSelectedVenueId(id);
              const nextCourts = await courtsApi.list(apiClient, session.tokens.accessToken, id);
              setCourts(nextCourts);
              const firstCourt = nextCourts[0];
              setSelectedCourtId(firstCourt?.id ?? '');
              setSelectedSportId(firstCourt?.sportIds[0] ?? '');
            }}
            empty="Create a venue first."
          />
          <ChoiceList
            items={courts.map(court => ({id: court.id, label: court.name}))}
            selectedId={selectedCourtId}
            onSelect={id => {
              const court = courts.find(item => item.id === id);
              setSelectedCourtId(id);
              setSelectedSportId(court?.sportIds[0] ?? '');
            }}
            empty="Create a court first."
          />
          {selectedCourt ? (
            <SegmentTabs
              items={lobbySports.map(sport => ({key: sport.id, label: sport.name}))}
              value={selectedSportId}
              onChange={setSelectedSportId}
            />
          ) : (
            <Text style={styles.empty}>Select a court to choose a supported sport.</Text>
          )}
          <SegmentTabs
            items={[
              {key: 'PRICE_PER_PLAYER', label: 'Per player'},
              {key: 'TOTAL_COURT_PRICE', label: 'Total court'},
            ]}
            value={pricingModel}
            onChange={value => setPricingModel(value as 'PRICE_PER_PLAYER' | 'TOTAL_COURT_PRICE')}
          />
          <View style={styles.twoColumns}>
            <AppTextField label="Min players" value={minPlayers} onChangeText={setMinPlayers} keyboardType="number-pad" />
            <AppTextField label="Max players" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />
          </View>
          <AppTextField label="Price amount" value={priceAmount} onChangeText={setPriceAmount} keyboardType="decimal-pad" />
          <AppTextField label="Description" value={description} onChangeText={setDescription} multiline />
          <View style={styles.actions}>
            <AppButton label="Create draft" onPress={() => createOrEditLobby('create')} disabled={busy || !selectedCourtId} />
            <AppButton
              label="Edit selected draft"
              onPress={() => createOrEditLobby('edit')}
              disabled={busy || !selectedLobbyId}
              variant="secondary"
            />
          </View>
        </FormSection>
        {lobbies.length === 0 ? (
          <EmptyState title="No lobbies yet" message="Create a draft after your court is ready." />
        ) : (
          lobbies.map(lobby => (
            <Pressable key={lobby.id} onPress={() => setSelectedLobbyId(lobby.id)}>
              <LobbyCard
                lobby={lobby}
                sportName={sports.find(sport => sport.id === lobby.sportId)?.name}
                actionLabel={lobby.status === 'DRAFT' ? 'Publish lobby' : undefined}
                onAction={() => publishLobby(lobby.id)}
                disabled={busy || !approved}
              />
            </Pressable>
          ))
        )}
      </View>
    );
  }

  function sportName(sportId: string): string {
    return sports.find(sport => sport.id === sportId)?.name ?? sportId.slice(0, 8);
  }
}

function ChoiceList({
  items,
  selectedId,
  onSelect,
  empty,
}: {
  items: {id: string; label: string}[];
  selectedId: string;
  onSelect: (id: string) => void | Promise<void>;
  empty: string;
}): React.JSX.Element {
  if (items.length === 0) {
    return <Text style={styles.empty}>{empty}</Text>;
  }

  return (
    <View style={styles.choiceList}>
      {items.map(item => (
        <Pressable
          key={item.id}
          onPress={() => onSelect(item.id)}
          style={[styles.choice, selectedId === item.id && styles.choiceSelected]}>
          <Text style={styles.choiceTitle}>{item.label}</Text>
          <Text style={styles.choiceMeta}>{item.id.slice(0, 8)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function buildLobbyRequest(
  venueId: string,
  courtId: string,
  sportId: string,
  values: {
    minPlayers: string;
    maxPlayers: string;
    pricingModel: 'PRICE_PER_PLAYER' | 'TOTAL_COURT_PRICE';
    priceAmount: string;
    description: string;
  },
): SaveLobbyRequest {
  if (!venueId || !courtId || !sportId) {
    throw new Error('Select venue, court, and sport first.');
  }
  const min = toPositiveInt(values.minPlayers);
  const max = toPositiveInt(values.maxPlayers);
  if (max < min) {
    throw new Error('Max players must be greater than or equal to min players.');
  }
  const price = Number(values.priceAmount);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Price amount must be a valid number.');
  }
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);
  return {
    venueId,
    courtId,
    sportId,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    minPlayers: min,
    maxPlayers: max,
    pricingModel: values.pricingModel,
    currencyCode: 'JOD',
    priceAmount: price,
    description: values.description,
    cancellationDeadlineAt: new Date(startsAt.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    confirmationDeadlineAt: new Date(startsAt.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  };
}

function toPositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Player counts must be positive numbers.');
  }
  return parsed;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  twoColumns: {
    gap: spacing.md,
  },
  choiceList: {
    gap: spacing.sm,
  },
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  choiceSelected: {
    borderColor: colors.accent,
  },
  choiceTitle: {
    ...typography.button,
    color: colors.text,
  },
  choiceMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  courtImage: {
    aspectRatio: 16 / 9,
    borderRadius: radii.sm,
    width: '100%',
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
  },
});
