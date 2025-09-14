import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: HealthPage());
  }
}

class ApiConfig {
  static String get base {
    if (Platform.isIOS) {
      // iOS Simulator can talk to your Mac’s loopback
      return 'http://127.0.0.1:4000/patients';
    } else if (Platform.isAndroid) {
      // Android emulator special alias for host machine
      return 'http://10.0.2.2:4000/patients';
    } else {
      // Fallback: adjust for web/desktop if you use them
      return 'http://127.0.0.1:4000/patients';
    }
  }
}

class HealthPage extends StatefulWidget {
  const HealthPage({super.key});
  @override
  State<HealthPage> createState() => _HealthPageState();
}

class _HealthPageState extends State<HealthPage> {
  String text = 'Loading...';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    // Android emulator must use 10.0.2.2 for localhost
    //final uri = Uri.parse('http://localhost:3000/health');
    final res = await http.get(Uri.parse('${ApiConfig.base}/health'));
    setState(() => text = res.body);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('MedID Health')),
      body: Center(child: Text(text)),
    );
  }
}
