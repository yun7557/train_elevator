import { useState } from "react";
import * as Location from 'expo-location';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function SearchScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // 현재 위치 가져오기
  const getUserLocation = async () => {
    setLoading(true); // 로딩 시작
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

  return (
    <View style={styles.container}>
    
     

      {/* 지도 컨테이너 */}
      <View style={styles.mapContainer}>
        {loading ? (
          // 위치를 가져오는 동안 로딩 인디케이터 표시
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="skyblue" />
            <Text style={styles.loadingText}>위치를 불러오는 중...</Text>
          </View>
        ) : permissionDenied ? (
          // 위치 권한 거부 시 메시지 표시
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>위치 권한이 필요합니다.</Text>
          </View>
        ) : location ? (
          // 위치 데이터가 있으면 지도 표시
          <MapView
            style={styles.map}
            provider="google"
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true} // 내 위치 아이콘 표시
          >
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="내 위치"
              description="현재 내 위치"
            />
          </MapView>
        ) : (
          // 초기 상태일 때 위치 요청 버튼 표시
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>위치를 확인하려면 버튼을 눌러주세요.</Text>
          </View>
        )}

        {/* 내 주변 건물 찾기 버튼 */}
        <TouchableOpacity style={styles.button} onPress={getUserLocation}>
          <Text style={styles.buttonText}>내 주변 가까운 엘리베이터 찾기</Text>
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
  titleContainer: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  text: {
    color: 'white',
    fontSize: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
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
