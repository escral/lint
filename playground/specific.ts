import { watch } from 'vue'

watch(() => 1, () => {
    console.log('watched')
})