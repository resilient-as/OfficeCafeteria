import React from 'react';
import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeGeneratorProps {
  empCode: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ empCode }) => {
  if (!empCode) {
    return (
      <View>
        <Text>No EmpCode provided</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <QRCode
        value={empCode}
        size={200}
        color="black"        
        logo ={require('../assets/images/react-logo.png')}
        logoSize={50}
        logoBackgroundColor="transparent"
      />
    </View>
  );
};

export default QRCodeGenerator;
