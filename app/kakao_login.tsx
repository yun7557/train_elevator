import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import { login, getProfile, logout } from '@react-native-seoul/kakao-login';

const kakao_login = () => {
    const [user, setUser] = useState<any>(null);

    // 로그인 함수: 카카오 네이티브 SDK를 이용해 로그인 진행
    const handleLogin = async () => {
        try {
            const token = await login();
            console.log('카카오 로그인 성공:', token);

            // 로그인 성공 후 사용자 프로필 정보 조회
            const profile = await getProfile();
            setUser(profile);
        } catch (error) {
            console.error('카카오 로그인 실패:', error);
            Alert.alert('로그인 실패', '카카오 로그인에 실패했습니다.');
        }
    };

    // 로그아웃 함수
    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            Alert.alert('로그아웃', '정상적으로 로그아웃되었습니다.');
        } catch (error) {
            console.error('로그아웃 실패:', error);
            Alert.alert('로그아웃 실패', '로그아웃 처리에 실패했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            {user ? (
                <>
                    <Text style={styles.welcomeText}>환영합니다, {user.nickname}님!</Text>
                    <Button title="카카오 로그아웃" onPress={handleLogout} />
                </>
            ) : (
                <Button title="카카오 로그인" onPress={handleLogin} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 18,
        marginBottom: 20,
    },
});

export default kakao_login;
