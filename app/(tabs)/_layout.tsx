
import { useNavigation,  } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


export default function TabLayout() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <SafeAreaProvider>      
      <SafeAreaView style={styles.container} >
      <ImageBackground source={require('../../assets/images/mainbg.jpg')} resizeMode="cover" style={styles.image}>
      
      <View style={styles.viewcon}>
        <Pressable
        onPress={() => {
          navigation.navigate("");
        }}
      >
        <Text>세팅으로</Text>
      </Pressable>
      <Pressable style={styles.Longbtn} onPress={() => navigation.navigate("search")}>
              <Text style={styles.btnText}>엘리베이터 찾기</Text>
            </Pressable>
        <View style={styles.btncontainer}> 
          <Text style={styles.btn}>회원가입 </Text>
          <Text style={styles.btn}>로그인</Text>
        </View>
      </View>
      </ImageBackground>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  Longbtn: {
    width: 250,
    textAlign: 'center',
    backgroundColor: 'skyblue',
    opacity: 0.9,
    color: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 20,
    marginBottom: 15,
  },
  btnText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
  },
  btncontainer: {
    flexDirection: 'row',  // 버튼을 가로 정렬
    justifyContent: 'center',
  },

  viewcon:{
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 50,
    alignItems: 'center',
    height: '100%',
  },

  btn: {
    backgroundColor: 'skyblue',
    opacity: 0.9,
    color: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    fontSize: 18,
    marginHorizontal: 5,  // 버튼 간격 조정
  },

});