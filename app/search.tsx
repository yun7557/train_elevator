import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Elevator {
  id: number;
  ele_geom: "point";
  // DB에서 내려온 좌표가 [경도, 위도] 순서로 구성된다고 가정합니다.
  coordinates: number[]; 
}

export default function SearchScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [elevators, setElevators] = useState<Elevator[]>([]);

  useEffect(() => {
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
    if (status !== "granted") {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation.coords);
    setLoading(false);
    // 위치를 얻은 후 엘리베이터 데이터 fetch 

  };

  // 엘리베이터 데이터를 API(DB)에서 받아오는 함수 
  const fetchElevators = async () => {
    if (!location) {
      alert("위치 정보를 먼저 가져와야 합니다!");
      return;
    }
    try {
      const radius = 200; // 검색 반경 설정 (1000km)
      const response = await fetch(
        `http://222.112.27.120:3002/elepoi/nearby?x=${location.longitude}&y=${location.latitude}&radius=${radius}`
        // `http://127.0.0.1:3002/elepoi/nearby?x=126.8817008&y=37.4803024&radius=${radius}`
      );
      const data: Elevator[] = await response.json();
      setElevators(data);
    } catch (error) {
      console.error('API 호출 오류:', error);
      alert('위치 정보를 불러오는 중 오류가 발생했습니다.');
    }
    // 실제 API 호출로 대체
    // const dummyElevators: Elevator[] = [
    //   {
    //     ele_id: 1,
    //     ele_geom: "point",
    //     // DB 좌표가 [경도, 위도] 순서라 가정. 사용자 위치에서 약간의 오프셋 추가
    //     coordinates: [coords.longitude + 0.001, coords.latitude + 0.001],
    //   },
    //   {
    //     ele_id: 2,
    //     ele_geom: "point",
    //     coordinates: [coords.longitude - 0.001, coords.latitude - 0.001],
    //   },
    // ];
    // setElevators(dummyElevators);
  };


  const handleButtonPress = () => {
    fetchElevators();
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="skyblue" />
            <Text style={styles.loadingText}>위치를 불러오는 중...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>위치 권한이 필요합니다.</Text>
          </View>
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
            {/* 내 위치 마커 */}
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="내 위치"
              description="현재 내 위치"
            />
            {/* DB에서 받아온 엘리베이터 마커 */}
            {elevators.map((elevator) => (
              <Marker
                key={`elevator-${elevator.id}`}
                coordinate={{
                  latitude: elevator.coordinates[1], // 위도
                  longitude: elevator.coordinates[0], // 경도
                }}
                title={`엘리베이터 ${elevator.id}`}
                description="DB에서 가져온 엘리베이터 위치"
              />
            ))}

          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>위치를 확인하려면 버튼을 눌러주세요.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
          <Text style={styles.buttonText}>
            내 주변 가까운{'\n'}엘리베이터 찾기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  mapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  button: {
    position: "absolute",
    bottom: 50,
    left: "45%",
    transform: [{ translateX: -75 }],
    backgroundColor: "skyblue",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
});
