import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const WEBSITE_URL = 'https://gav-mart-customers.pranitc93.workers.dev';

function App() {
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Gav Baazar needs your location to show nearby service.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
    }
  };

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected =
        state.isConnected && state.isInternetReachable !== false;

      if (!isConnected) {
        wasOffline.current = true;
      }

      if (isConnected && wasOffline.current) {
        wasOffline.current = false;

        setTimeout(() => {
          webViewRef.current?.reload();
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, []);

  const openGoogleLoginOutsideApp = async url => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          showTitle: true,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      await Linking.openURL(url);
    }
  };

  const handleRequest = request => {
    const url = request.url;

    if (
      url.includes('accounts.google.com') ||
      url.includes('googleusercontent.com') ||
      url.includes('oauth2') ||
      url.includes('/auth/google')
    ) {
      openGoogleLoginOutsideApp(url);
      return false;
    }

    return true;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <WebView
          ref={webViewRef}
          source={{uri: WEBSITE_URL}}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          startInLoadingState={true}
          onNavigationStateChange={navState => {
            setCanGoBack(navState.canGoBack);
          }}
          onShouldStartLoadWithRequest={handleRequest}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default App;