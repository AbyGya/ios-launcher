plugins {
  id("com.android.application")
}

val versionCodeEnv = System.getenv("VERSION_CODE")?.toIntOrNull() ?: 1
val versionNameEnv = System.getenv("VERSION_NAME") ?: "0.1.0"
val keystorePath = System.getenv("KEYSTORE_PATH")

android {
  namespace = "com.abygya.ioslauncher"
  compileSdk = 36

  defaultConfig {
    applicationId = "com.abygya.ioslauncher"
    minSdk = 26
    targetSdk = 36
    versionCode = versionCodeEnv
    versionName = versionNameEnv
    resourceConfigurations += listOf("en", "in")
  }

  signingConfigs {
    if (keystorePath != null) {
      create("release") {
        storeFile = file(keystorePath)
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASSWORD")
      }
    }
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      signingConfig = signingConfigs.getByName(if (keystorePath != null) "release" else "debug")
    }
  }

  buildFeatures {
    buildConfig = false
    resValues = false
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  lint {
    abortOnError = false
  }
}

dependencies {
}
