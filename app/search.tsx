import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

// T Map API 키 (SK T Map Open API에서 발급받은 키로 교체)
const TMAP_API_KEY = 'eaZt8KpPZ014UadFY7wbR9XT6nhUnfEbFGlpb2G1';

interface Elevator {
    id: number;
    geom: {
        type: string;
        coordinates: [number, number] | null;
    };
    elepoi_train_na: string;
}

export default function SearchScreen() {
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [loading, setLoading] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [elevators, setElevators] = useState<Elevator[]>([]);
    const [selectedElevator, setSelectedElevator] = useState<Elevator | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<
        { latitude: number; longitude: number }[]
    >([]);

    useEffect(() => {
        setLoading(true);
        getUserLocation();
    }, []);

    useEffect(() => {
        if (location) {
            fetchElevators();
        }
    }, [location]);

    // 사용자 현재 위치 가져오기
    const getUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setPermissionDenied(true);
            setLoading(false);
            return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);
        setLoading(false);
    };

    // 엘리베이터 데이터를 API에서 받아오는 함수
    const fetchElevators = async () => {
        if (!location) {
            alert('위치 정보를 먼저 가져와야 합니다!');
            return;
        }

        setLoading(true);
        try {
            const radius = 1200;
            const myx = 126.8895972;
            const myy = 37.49265;
            // 실제 사용 시 location의 좌표를 사용하거나, 테스트를 위해 고정 좌표(myx, myy)를 사용할 수 있음
            const response = await fetch(
                `https://elevator-search-hyj-88013499747.asia-northeast2.run.app/elepoi/nearby?x=${myx}&y=${myy}&radius=${radius}`
                // `https://elevator-search-hyj-88013499747.asia-northeast2.run.app/elepoi/nearby?x=${location.longitude}&y=${location.latitude}&radius=${radius}`
            );

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status}`);
            }

            const data = await response.json();

            const formattedData = data
                .filter(
                    (elevator: any) =>
                        elevator.geom &&
                        Array.isArray(elevator.geom.coordinates) &&
                        elevator.geom.coordinates.length === 2
                )
                .map((elevator: any) => ({
                    id: elevator.id,
                    geom: {
                        type: elevator.geom.type || 'Point',
                        coordinates: elevator.geom.coordinates as [number, number],
                    },
                    elepoi_train_na: elevator.elepoi_train_na || '역 정보 없음',
                }));

            setElevators(formattedData);
        } catch (error) {
            console.error('API 호출 오류:', error);
            alert('위치 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // T Map API를 사용하여 도보 경로를 가져오는 함수
    const fetchTmapWalkingRoute = async (
        origin: { latitude: number; longitude: number },
        destination: { latitude: number; longitude: number }
    ) => {
        try {
            const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian';
            // T Map API는 POST 요청을 사용함
            const body = {
                startX: origin.longitude.toString(), // 출발지 경도
                startY: origin.latitude.toString(), // 출발지 위도
                endX: destination.longitude.toString(), // 도착지 경도
                endY: destination.latitude.toString(), // 도착지 위도
                reqCoordType: 'WGS84GEO',
                resCoordType: 'WGS84GEO',
                startName: '현재 위치',
                endName: destination ? '엘리베이터 위치' : '',
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    appKey: TMAP_API_KEY,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`T Map API 요청 실패: ${response.status}`);
            }

            const data = await response.json();
            // data.features 내에 경로 좌표들이 포함되어 있음 (GeoJSON 형식)
            // 예시: data.features[0].geometry.coordinates 는 [ [lng, lat], [lng, lat], ... ]
            // data.features 를 순회하면서 geometry.type 이 "LineString" 인 경우만 처리
            if (data.features && data.features.length > 0) {
                const coordinates: { latitude: number; longitude: number }[] = [];

                data.features.forEach((feature: any) => {
                    // geometry가 존재하는지, type이 "LineString"인지 확인
                    if (
                        feature.geometry &&
                        feature.geometry.type === 'LineString' &&
                        Array.isArray(feature.geometry.coordinates)
                    ) {
                        feature.geometry.coordinates.forEach((coord: number[]) => {
                            // coord가 [경도, 위도] 형태인지 확인
                            if (
                                Array.isArray(coord) &&
                                coord.length === 2 &&
                                typeof coord[0] === 'number' &&
                                typeof coord[1] === 'number'
                            ) {
                                coordinates.push({
                                    latitude: coord[1],
                                    longitude: coord[0],
                                });
                            }
                        });
                    }
                });

                // 최종 좌표 배열을 상태에 저장
                setRouteCoordinates(coordinates);
            } else {
                setRouteCoordinates([]);
            }
        } catch (error) {
            console.error('T Map API 호출 오류:', error);
            alert('도보 경로를 가져오는 중 오류가 발생했습니다.');
        }
    };

    // 엘리베이터 마커 클릭 시 호출되는 함수
    const handleMarkerPress = (elevator: Elevator) => {
        setSelectedElevator(elevator);
        if (location && elevator.geom.coordinates) {
            const destination = {
                latitude: elevator.geom.coordinates[1],
                longitude: elevator.geom.coordinates[0],
            };
            fetchTmapWalkingRoute(
                { latitude: location.latitude, longitude: location.longitude },
                destination
            );
        }
    };

    const handleButtonPress = () => {
        fetchElevators();
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="skyblue" />
                ) : permissionDenied ? (
                    <Text style={styles.errorText}>위치 권한이 필요합니다.</Text>
                ) : location ? (
                    <MapView
                        style={styles.map}
                        provider="google"
                        initialRegion={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation={true}
                    >
                        <Marker
                            coordinate={{
                                latitude: location.latitude,
                                longitude: location.longitude,
                            }}
                            title="내 위치"
                            description="현재 내 위치"
                        />
                        {elevators.map((elevator) =>
                            elevator.geom.coordinates ? (
                                <Marker
                                    key={`elevator-${elevator.id}`}
                                    coordinate={{
                                        latitude: elevator.geom.coordinates[1],
                                        longitude: elevator.geom.coordinates[0],
                                    }}
                                    title={`엘리베이터 ${elevator.id}`}
                                    description={elevator.elepoi_train_na}
                                    onPress={() => handleMarkerPress(elevator)}
                                />
                            ) : null
                        )}
                        {/* 경로 Polyline 표시 */}
                        {routeCoordinates.length > 0 && (
                            <Polyline
                                coordinates={routeCoordinates}
                                strokeColor="blue"
                                strokeWidth={4}
                            />
                        )}
                    </MapView>
                ) : (
                    <Text style={styles.loadingText}>위치를 확인하려면 버튼을 눌러주세요.</Text>
                )}
                <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
                    <Text style={styles.buttonText}>내 주변 엘리베이터 찾기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
    },
    mapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingText: {
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    button: {
        position: 'absolute',
        bottom: 50,
        left: '45%',
        transform: [{ translateX: -75 }],
        backgroundColor: 'skyblue',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
