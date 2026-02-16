import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'es' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.ranking': 'Ranking',
    'nav.profile': 'Perfil',
    'nav.admin': 'Admin',
    'nav.levels': 'Niveles',
    'nav.logout': 'Salir',
    'nav.login': 'Iniciar sesión',
    
    // Home
    'home.hello': '¡Hola',
    'home.welcome': 'Bienvenido a tu plataforma de aprendizaje de alemán',
    'home.today': 'Hoy estudiamos',
    'home.lection': 'Ver explicación',
    'home.ready': '¿Listo para aprender',
    'home.instructions': 'Completa ejercicios, sube en el ranking y desbloquea nuevos niveles',
    'home.levels': 'IR A LOS NIVELES',
    'home.subtitle': 'Aprende alemán de forma divertida e interactiva',
    'home.levelsToday': 'Niveles Hoy',
    'home.totalPoints': 'Puntos Totales',
    'home.maxLevel': 'Nivel Máximo',
    'home.startJourney': '¡Comienza tu viaje de aprendizaje!',
    'home.chooseLevel': 'Elige un nivel y comienza a practicar alemán de forma divertida',
    'home.startExercises': 'Comenzar Ejercicios',
    
    // Levels
    'levels.title': 'Selecciona tu Nivel',
    'levels.level': 'Nivel',
    'levels.locked': 'Bloqueado',
    'levels.unlocked': 'Desbloqueado',
    'levels.highscore': 'Mejor puntuación',
    'levels.highscore24h': 'Highscore (24h)',
    'levels.lockedMsg': '¡Bloqueado!',
    'levels.completeToUnlock': 'Completa el nivel anterior para desbloquear',
    'levels.improveScore': 'Mejora tu puntuación',
    'levels.top5': 'TOP 5',
    'levels.play': 'Jugar',
    'levels.loginToUnlock': 'Inicia sesión para desbloquear',
    'levels.unlockedWithPro': 'Desbloqueado con PRO',
    'levels.reachTop5OrPro': 'Alcanza el top 5 en el nivel anterior o hazte usuario PRO por sólo 1,99€',
    
    // Game
    'game.exercise': 'Ejercicio',
    'game.of': 'de',
    'game.level': 'Nivel',
    'game.topic': 'Tema',
    'game.check': 'Comprobar',
    'game.continue': 'Continuar',
    'game.correct': '¡Correcto!',
    'game.incorrect': 'Incorrecto',
    'game.noExercises': 'No hay ejercicios',
    'game.noExercisesTopic': 'No hay ejercicios disponibles para el tema',
    'game.noExercisesLevel': 'No hay ejercicios disponibles para este nivel',
    'game.errorLoading': 'No se pudieron cargar los ejercicios',
    'game.resultSaved': '¡Resultado guardado!',
    'game.scoreSaved': 'Tu puntuación de {score} puntos ha sido guardada.',
    
    // Exercise types
    'exercise.fillBlank': 'Completa la frase',
    'exercise.fillBlankWriting': 'Completa la frase escribiendo',
    'exercise.freeWriting': 'Redacción libre',
    'exercise.identify': 'Identifica la palabra',
    'exercise.listening': 'Escucha y selecciona la traducción correcta',
    'exercise.wheelFortune': 'La Ruleta de la Fortuna',
    'exercise.wheelFortuneInstructions': 'Adivina la frase letra por letra. Cada letra incorrecta resta 10 puntos.',
    'exercise.showHint': 'Mostrar pista',
    'exercise.showWord': 'Ver palabra',
    'exercise.hideWord': 'Ocultar palabra',
    'exercise.wrongAttempts': 'Intentos incorrectos',
    'exercise.showSolution': 'Mostrar solución',
    'exercise.translation': 'Traducción',
    'exercise.audioError': 'No se ha podido reproducir el audio en este navegador. Recomendamos Chrome en Android y Safari en iOS.',
    'exercise.optionalNonScoring': 'Ejercicio opcional - No puntúa',
    'exercise.typeAnswer': 'Escribe tu respuesta aquí...',
    'exercise.correct': 'Corregir',
    'exercise.skipExercise': 'Saltar ejercicio',
    'exercise.wordSearch': 'Sopa de Letras',
    'exercise.lettersFound': 'Letras encontradas',
    'exercise.solve': 'Solucionar',
    
    // Feedback
    'feedback.excellent': '¡Excelente!',
    'feedback.incorrect': 'Respuesta incorrecta',
    'feedback.correctAnswer': 'La respuesta correcta es:',
    'feedback.continue': 'CONTINUAR',
    
    // Congratulations
    'congrats.title': '¡Felicitaciones!',
    'congrats.completed': 'Has completado el Nivel',
    'congrats.score': 'Puntuación Total',
    'congrats.encouragement': '¡Excelente trabajo! Sigue practicando para mejorar tus habilidades',
    'congrats.saveAndContinue': 'Continuar',
    'congrats.backHome': 'Volver al Inicio',
    'congrats.continue': 'Continuar',
    'congrats.saveResults': 'Guardar resultados',
    'congrats.loginToSave': 'Inicia sesión para guardar tu progreso',
    'congrats.nextLevel': 'Siguiente nivel',
    'congrats.changeTopic': 'Cambiar de tema',
    
    // Profile
    'profile.title': 'Mi Perfil',
    'profile.email': 'Email',
    'profile.member': 'Miembro desde',
    'profile.admin': 'Administrador',
    'profile.pro': 'PRO',
    'profile.free': 'Usuario Gratis',
    'profile.user': 'Usuario',
    'profile.changePassword': 'Cambiar contraseña',
    'profile.newPassword': 'Nueva contraseña',
    'profile.confirmPassword': 'Confirmar contraseña',
    'profile.updatePassword': 'Actualizar contraseña',
    'profile.progressByLevel': 'Progreso por nivel',
    'profile.highscore': 'Mejor puntuación',
    'profile.completed': 'Ejercicios completados',
    'profile.accuracy': 'Precisión',
    'profile.noProgress': 'Sin progreso',
    'profile.passwordUpdated': 'Contraseña actualizada',
    'profile.passwordChanged': 'Tu contraseña ha sido cambiada exitosamente',
    'profile.passwordMismatch': 'Las contraseñas no coinciden',
    'profile.passwordMinLength': 'La contraseña debe tener al menos 6 caracteres',
    'profile.passwordError': 'No se pudo cambiar la contraseña',
    
    // Ranking
    'ranking.title': 'Clasificación Diaria',
    'ranking.subtitle': 'Compite con otros usuarios y alcanza el top 5 para desbloquear el siguiente nivel',
    'ranking.level': 'Nivel',
    'ranking.position': 'Posición',
    'ranking.user': 'Usuario',
    'ranking.score': 'Puntuación',
    'ranking.noRanking': 'Aún no hay clasificación para hoy',
    'ranking.you': 'Tú',
    
    // Admin
    'admin.title': 'Panel de Administración',
    'admin.exercises': 'Ejercicios',
    'admin.users': 'Usuarios',
    'admin.accessDenied': 'Acceso denegado',
    'admin.noPermission': 'No tienes permisos de administrador',
    
    // Auth
    'auth.login': 'Iniciar sesión',
    'auth.signup': 'Registrarse',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.resetPassword': 'Recuperar contraseña',
    'auth.resetEmailSent': 'Email enviado',
    'auth.resetEmailSentDesc': 'Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.',
    'auth.backToLogin': 'Volver a iniciar sesión',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.hasAccount': '¿Ya tienes cuenta?',
    'auth.username': 'Nombre de usuario',
    'auth.signupSuccess': '¡Registro exitoso!',
    'auth.verifyEmail': 'Por favor verifica tu email para confirmar tu cuenta.',
    'auth.loginSuccess': '¡Bienvenido de nuevo!',
    'auth.error': 'Error',
    'auth.emailRegistered': 'Este email ya está registrado. Intenta iniciar sesión.',
    'auth.emailNotConfirmed': 'Email no confirmado',
    'auth.checkEmailConfirmation': 'Por favor, confirma tu email haciendo clic en el enlace que te enviamos. Revisa tu bandeja de entrada y spam.',
    'auth.validationError': 'Error de validación',
    'auth.signupBenefit': 'Regístrate gratis para obtener acceso a más niveles de aprendizaje',
    
    // Theme
    'theme.light': 'Modo claro',
    'theme.dark': 'Modo oscuro',
    'theme.toggle': 'Cambiar tema',
    
    // Language
    'lang.spanish': 'Español',
    'lang.german': 'Alemán',
    
    // Topics
    'topics.allTopics': 'Todos los temas',
    'topics.viewExplanation': 'Ver explicación',
    'topics.viewVideo': 'Ver vídeo',
    
    // Footer
    'footer.reportError': 'Notificar un error',
    'footer.contactWhatsApp': 'Contactar por WhatsApp',
    'footer.reportErrorTitle': 'Notificar un error',
    'footer.reportErrorDesc': 'Describe el error que has encontrado. Se incluirá automáticamente la ubicación actual.',
    'footer.currentLocation': 'Ubicación actual',
    'footer.errorDescription': 'Descripción del error',
    'footer.errorPlaceholder': 'Describe qué ha fallado o qué comportamiento inesperado has encontrado...',
    'footer.sendReport': 'Enviar reporte',
    'footer.errorReported': 'Error reportado',
    'footer.errorReportedDesc': 'Gracias por tu reporte. Lo revisaremos pronto.',
    'footer.errorMessageRequired': 'Por favor describe el error',
    
    // Contact
    'contact.loginRequired': 'Debes iniciar sesión para enviar un reporte',
    'contact.sending': 'Enviando...',
    'contact.error': 'Error al enviar el mensaje',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.cancel': 'Cancelar',
    'common.points': 'puntos',
  },
  de: {
    // Navbar
    'nav.home': 'Startseite',
    'nav.ranking': 'Rangliste',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'nav.levels': 'Niveaus',
    'nav.logout': 'Abmelden',
    'nav.login': 'Anmelden',
    
    // Home
    'home.hello': 'Hallo',
    'home.welcome': 'Willkommen zu deiner Deutsch-Lernplattform',
    'home.today': 'Heute wir studieren',
    'home.lection': 'Zur Erklärung',
    'home.ready': 'Bist Du Startklar',
    'home.instructions': 'Schließe Übungen ab, steig im Ranking auf und schalte neue Level frei',
    'home.levels': 'Zur Übungen',
    'home.subtitle': 'Lerne Deutsch auf unterhaltsame und interaktive Weise',
    'home.levelsToday': 'Niveaus Heute',
    'home.totalPoints': 'Gesamtpunkte',
    'home.maxLevel': 'Höchstes Niveau',
    'home.startJourney': 'Beginne deine Lernreise!',
    'home.chooseLevel': 'Wähle ein Niveau und beginne auf unterhaltsame Weise Deutsch zu üben',
    'home.startExercises': 'Übungen Beginnen',
    
    // Levels
    'levels.title': 'Wähle dein Niveau',
    'levels.level': 'Niveau',
    'levels.locked': 'Gesperrt',
    'levels.unlocked': 'Freigeschaltet',
    'levels.highscore': 'Höchstpunktzahl',
    'levels.highscore24h': 'Highscore (24h)',
    'levels.lockedMsg': 'Gesperrt!',
    'levels.completeToUnlock': 'Schließe das vorherige Niveau ab, um freizuschalten',
    'levels.improveScore': 'Verbessere deine Punktzahl',
    'levels.top5': 'TOP 5',
    'levels.play': 'Spielen',
    'levels.loginToUnlock': 'Melde dich an, um freizuschalten',
    'levels.unlockedWithPro': 'Mit PRO freigeschaltet',
    'levels.reachTop5OrPro': 'Erreiche die Top 5 im vorherigen Niveau oder werde PRO-Benutzer für nur 1,99€',
    
    // Game
    'game.exercise': 'Übung',
    'game.of': 'von',
    'game.level': 'Niveau',
    'game.topic': 'Thema',
    'game.check': 'Überprüfen',
    'game.continue': 'Weiter',
    'game.correct': 'Richtig!',
    'game.incorrect': 'Falsch',
    'game.noExercises': 'Keine Übungen',
    'game.noExercisesTopic': 'Keine Übungen für dieses Thema verfügbar',
    'game.noExercisesLevel': 'Keine Übungen für dieses Niveau verfügbar',
    'game.errorLoading': 'Übungen konnten nicht geladen werden',
    'game.resultSaved': 'Ergebnis gespeichert!',
    'game.scoreSaved': 'Deine Punktzahl von {score} Punkten wurde gespeichert.',
    
    // Exercise types
    'exercise.fillBlank': 'Vervollständige den Satz',
    'exercise.fillBlankWriting': 'Vervollständige den Satz schriftlich',
    'exercise.freeWriting': 'Freies Schreiben',
    'exercise.identify': 'Identifiziere das Wort',
    'exercise.listening': 'Höre zu und wähle die richtige Übersetzung',
    'exercise.wheelFortune': 'Das Glücksrad',
    'exercise.wheelFortuneInstructions': 'Errate den Satz Buchstabe für Buchstabe. Jeder falsche Buchstabe kostet 10 Punkte.',
    'exercise.showHint': 'Hinweis anzeigen',
    'exercise.showWord': 'Wort anzeigen',
    'exercise.hideWord': 'Wort verbergen',
    'exercise.wrongAttempts': 'Falsche Versuche',
    'exercise.showSolution': 'Lösung anzeigen',
    'exercise.translation': 'Übersetzung',
    'exercise.audioError': 'Audio konnte in diesem Browser nicht abgespielt werden. Wir empfehlen Chrome auf Android und Safari auf iOS.',
    'exercise.optionalNonScoring': 'Optionale Übung - Keine Punkte',
    'exercise.typeAnswer': 'Schreibe deine Antwort hier...',
    'exercise.correct': 'Korrigieren',
    'exercise.skipExercise': 'Übung überspringen',
    'exercise.wordSearch': 'Buchstabensuppe',
    'exercise.lettersFound': 'Gefundene Buchstaben',
    'exercise.solve': 'Lösung zeigen',
    
    // Feedback
    'feedback.excellent': 'Ausgezeichnet!',
    'feedback.incorrect': 'Falsche Antwort',
    'feedback.correctAnswer': 'Die richtige Antwort ist:',
    'feedback.continue': 'WEITER',
    
    // Congratulations
    'congrats.title': 'Glückwunsch!',
    'congrats.completed': 'Du hast Niveau abgeschlossen',
    'congrats.score': 'Gesamtpunktzahl',
    'congrats.encouragement': 'Ausgezeichnete Arbeit! Übe weiter, um deine Fähigkeiten zu verbessern',
    'congrats.saveAndContinue': 'Weiter',
    'congrats.backHome': 'Zurück zum Start',
    'congrats.continue': 'Weiter',
    'congrats.saveResults': 'Ergebnisse speichern',
    'congrats.loginToSave': 'Melde dich an, um deinen Fortschritt zu speichern',
    'congrats.nextLevel': 'Nächstes Niveau',
    'congrats.changeTopic': 'Thema wechseln',
    
    // Profile
    'profile.title': 'Mein Profil',
    'profile.email': 'E-Mail',
    'profile.member': 'Mitglied seit',
    'profile.admin': 'Administrator',
    'profile.pro': 'PRO',
    'profile.free': 'Kostenloser Benutzer',
    'profile.user': 'Benutzer',
    'profile.changePassword': 'Passwort ändern',
    'profile.newPassword': 'Neues Passwort',
    'profile.confirmPassword': 'Passwort bestätigen',
    'profile.updatePassword': 'Passwort aktualisieren',
    'profile.progressByLevel': 'Fortschritt nach Niveau',
    'profile.highscore': 'Höchstpunktzahl',
    'profile.completed': 'Abgeschlossene Übungen',
    'profile.accuracy': 'Genauigkeit',
    'profile.noProgress': 'Kein Fortschritt',
    'profile.passwordUpdated': 'Passwort aktualisiert',
    'profile.passwordChanged': 'Dein Passwort wurde erfolgreich geändert',
    'profile.passwordMismatch': 'Die Passwörter stimmen nicht überein',
    'profile.passwordMinLength': 'Das Passwort muss mindestens 6 Zeichen lang sein',
    'profile.passwordError': 'Passwort konnte nicht geändert werden',
    
    // Ranking
    'ranking.title': 'Tägliche Rangliste',
    'ranking.subtitle': 'Konkurriere mit anderen Benutzern und erreiche die Top 5, um das nächste Niveau freizuschalten',
    'ranking.level': 'Niveau',
    'ranking.position': 'Position',
    'ranking.user': 'Benutzer',
    'ranking.score': 'Punktzahl',
    'ranking.noRanking': 'Noch keine Rangliste für heute',
    'ranking.you': 'Du',
    
    // Admin
    'admin.title': 'Verwaltungspanel',
    'admin.exercises': 'Übungen',
    'admin.users': 'Benutzer',
    'admin.accessDenied': 'Zugriff verweigert',
    'admin.noPermission': 'Du hast keine Administratorrechte',
    
    // Auth
    'auth.login': 'Anmelden',
    'auth.signup': 'Registrieren',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.forgotPassword': 'Passwort vergessen?',
    'auth.resetPassword': 'Passwort zurücksetzen',
    'auth.resetEmailSent': 'E-Mail gesendet',
    'auth.resetEmailSentDesc': 'Wir haben dir einen Link zum Zurücksetzen deines Passworts gesendet. Überprüfe deinen Posteingang und Spam-Ordner.',
    'auth.backToLogin': 'Zurück zur Anmeldung',
    'auth.noAccount': 'Noch kein Konto?',
    'auth.hasAccount': 'Hast du bereits ein Konto?',
    'auth.username': 'Benutzername',
    'auth.signupSuccess': 'Registrierung erfolgreich!',
    'auth.verifyEmail': 'Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.',
    'auth.loginSuccess': 'Willkommen zurück!',
    'auth.error': 'Fehler',
    'auth.emailRegistered': 'Diese E-Mail ist bereits registriert. Versuche dich anzumelden.',
    'auth.emailNotConfirmed': 'E-Mail nicht bestätigt',
    'auth.checkEmailConfirmation': 'Bitte bestätige deine E-Mail, indem du auf den Link klickst, den wir dir gesendet haben. Überprüfe deinen Posteingang und Spam-Ordner.',
    'auth.validationError': 'Validierungsfehler',
    'auth.signupBenefit': 'Registriere dich kostenlos, um Zugang zu mehr Lernstufen zu erhalten',
    
    // Theme
    'theme.light': 'Heller Modus',
    'theme.dark': 'Dunkler Modus',
    'theme.toggle': 'Thema wechseln',
    
    // Language
    'lang.spanish': 'Spanisch',
    'lang.german': 'Deutsch',
    
    // Topics
    'topics.allTopics': 'Alle Themen',
    'topics.viewExplanation': 'Erklärung ansehen',
    'topics.viewVideo': 'Video ansehen',
    
    // Footer
    'footer.reportError': 'Fehler melden',
    'footer.contactWhatsApp': 'Per WhatsApp kontaktieren',
    'footer.reportErrorTitle': 'Fehler melden',
    'footer.reportErrorDesc': 'Beschreibe den Fehler, den du gefunden hast. Der aktuelle Standort wird automatisch eingefügt.',
    'footer.currentLocation': 'Aktueller Standort',
    'footer.errorDescription': 'Fehlerbeschreibung',
    'footer.errorPlaceholder': 'Beschreibe, was schiefgelaufen ist oder welches unerwartete Verhalten du gefunden hast...',
    'footer.sendReport': 'Bericht senden',
    'footer.errorReported': 'Fehler gemeldet',
    'footer.errorReportedDesc': 'Danke für deinen Bericht. Wir werden ihn bald überprüfen.',
    'footer.errorMessageRequired': 'Bitte beschreibe den Fehler',
    
    // Contact
    'contact.loginRequired': 'Du musst angemeldet sein, um einen Bericht zu senden',
    'contact.sending': 'Wird gesendet...',
    'contact.error': 'Fehler beim Senden der Nachricht',
    
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.cancel': 'Abbrechen',
    'common.points': 'Punkte',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'es' || saved === 'de') ? saved : 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
