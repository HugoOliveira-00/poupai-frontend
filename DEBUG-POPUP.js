// ========================================
// 🔍 SCRIPT DE DEBUG - Popup de Novidades
// ========================================
// Cole este código no console do navegador após fazer login

console.log('=== DEBUG: Popup de Novidades ===\n');

// 1. Verifica usuário autenticado
console.log('1️⃣ Usuário:', currentUser);
console.log('   - ID:', currentUser?.id);
console.log('   - Nome:', currentUser?.nome);
console.log('   - Email:', currentUser?.email);
console.log('   - Onboarding Completo:', currentUser?.onboardingCompleted);
console.log('   - Última Versão Vista:', currentUser?.ultimaVersaoVisualizada);
console.log('');

// 2. Verifica constantes
console.log('2️⃣ Constantes:');
console.log('   - CURRENT_VERSION:', typeof CURRENT_VERSION !== 'undefined' ? CURRENT_VERSION : '❌ NÃO DEFINIDA');
console.log('   - RELEASE_DATE:', typeof RELEASE_DATE !== 'undefined' ? RELEASE_DATE : '❌ NÃO DEFINIDA');
console.log('');

// 3. Verifica modal no HTML
const modal = document.getElementById('whatsNewModal');
console.log('3️⃣ Modal HTML:');
console.log('   - Existe?', modal ? '✅ SIM' : '❌ NÃO');
console.log('   - Display:', modal ? modal.style.display : 'N/A');
console.log('');

// 4. Verifica bottom nav
const bottomNav = document.querySelector('.bottom-nav');
console.log('4️⃣ Bottom Nav:');
console.log('   - Existe?', bottomNav ? '✅ SIM' : '❌ NÃO');
console.log('   - Display:', bottomNav ? getComputedStyle(bottomNav).display : 'N/A');
console.log('');

// 5. Verifica funções
console.log('5️⃣ Funções:');
console.log('   - showWhatsNewModal:', typeof showWhatsNewModal !== 'undefined' ? '✅ EXISTE' : '❌ NÃO EXISTE');
console.log('   - closeWhatsNewModal:', typeof closeWhatsNewModal !== 'undefined' ? '✅ EXISTE' : '❌ NÃO EXISTE');
console.log('   - checkAndShowWhatsNew:', typeof checkAndShowWhatsNew !== 'undefined' ? '✅ EXISTE' : '❌ NÃO EXISTE');
console.log('');

// 6. Testa lógica
if (currentUser && currentUser.id) {
    const lastVersionViewed = currentUser.ultimaVersaoVisualizada || '';
    const shouldShow = lastVersionViewed !== CURRENT_VERSION;
    
    console.log('6️⃣ Lógica de Exibição:');
    console.log('   - Última Versão Vista:', lastVersionViewed || '(vazio)');
    console.log('   - Versão Atual:', CURRENT_VERSION);
    console.log('   - Deve mostrar popup?', shouldShow ? '✅ SIM' : '❌ NÃO');
    console.log('');
    
    if (shouldShow) {
        console.log('✅ Popup DEVERIA aparecer!');
        console.log('   Execute: showWhatsNewModal()');
    } else {
        console.log('❌ Popup NÃO deve aparecer (já foi visto)');
        console.log('   Para forçar: currentUser.ultimaVersaoVisualizada = ""; showWhatsNewModal()');
    }
} else {
    console.log('❌ Usuário não autenticado!');
}

console.log('\n=== FIM DO DEBUG ===');
