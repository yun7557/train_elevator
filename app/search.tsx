import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Elevator {
 
  id: number;
  geom: {
    type: string;
    coordinates: number[];
  };
  coordinates: number[]; // Add this property to match the usage in the code
}

export default function SearchScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [elevators, setElevators] = useState<Elevator[]>([]);

  useEffect(() => {
    setLoading(true);
    getUserLocation();
  }, []);

  // location 업데이트 시 단 한 번만 fetchElevators() 호출
  useEffect(() => {
    if (location) {
      console.log("Location Updated:", location);
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
  };

  // 엘리베이터 데이터를 API에서 받아오는 함수 
  const fetchElevators = async () => {
    if (!location || location.latitude === undefined || location.longitude === undefined) {
      alert("위치 정보를 먼저 가져와야 합니다!");
      return;
    }
  
    setLoading(true);
    console.log("Fetching elevators from API...");
  
    try {
      const response = await fetch(
        `https://elevator-search-hyj-88013499747.asia-northeast2.run.app/elepoi/nearby?x=${location.longitude}&y=${location.latitude}&radius=200`
      );
  
      console.log("API Response Status:", response.status);
  
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Fetched Elevators Data:", data);
  
      if (!data || !Array.isArray(data)) {
        throw new Error("API 응답 형식 오류");
      }
  
      // geom.coordinates에서 필요한 좌표만 추출해서 coordinates 필드를 생성
      const formattedData = data.map((elevator: any) => ({
        id: elevator.id,
        geom: elevator.geom?.type || "point",
        coordinates: elevator.geom?.coordinates || [0, 0],
      }));
  
      console.log("Formatted Elevators Data:", formattedData);
      setElevators(formattedData);
    } catch (error) {
      console.error("API 호출 오류:", error);
      alert("위치 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="내 위치"
              description="현재 내 위치"
            />
            {elevators.map((elevator) =>
              elevator.geom.coordinates &&
              elevator.geom.coordinates.length === 2 &&
              isFinite(elevator.geom.coordinates[0]) &&
              isFinite(elevator.geom.coordinates[1]) ? (
                <Marker
                  key={`elevator-${elevator.id}`}
                  coordinate={{
                    latitude: elevator.coordinates[1],
                    longitude: elevator.coordinates[0],
                  }}
                  title={`엘리베이터 ${elevator.id}`}
                  description="DB에서 가져온 엘리베이터 위치"
                />
              ) : null
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>위치를 확인하려면 버튼을 눌러주세요.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
          <Text style={styles.buttonText}>
            내 주변 가까운{"\n"}엘리베이터 찾기
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
