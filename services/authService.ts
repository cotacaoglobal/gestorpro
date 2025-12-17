import bcrypt from 'bcryptjs';

/**
 * AuthService - Serviço de Autenticação Segura
 * 
 * Responsável por operações criptográficas de senha usando bcrypt.
 * Segue melhores práticas de segurança para 2025.
 */
export const AuthService = {
    /**
     * Gera hash seguro de senha usando bcrypt
     * @param plainPassword - Senha em texto plano
     * @returns Hash bcrypt (60 caracteres)
     * 
     * Cost factor: 12 (padrão 2025 - ~250ms por hash)
     * Protege contra ataques de força bruta através de salt único por senha
     */
    hashPassword: async (plainPassword: string): Promise<string> => {
        // Validação básica
        if (!plainPassword || plainPassword.length < 8) {
            throw new Error('Senha deve ter pelo menos 8 caracteres');
        }

        // Salt com cost factor 12 (2^12 = 4096 rounds)
        const salt = await bcrypt.genSalt(12);
        return await bcrypt.hash(plainPassword, salt);
    },

    /**
     * Verifica se senha fornecida corresponde ao hash armazenado
     * @param plainPassword - Senha fornecida pelo usuário
     * @param hashedPassword - Hash armazenado no banco de dados
     * @returns true se senha correta, false caso contrário
     * 
     * Tempo constante de verificação previne timing attacks
     */
    verifyPassword: async (
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> => {
        try {
            // Verificar se é hash bcrypt válido
            if (!hashedPassword || !hashedPassword.startsWith('$2')) {
                console.error('Hash inválido fornecido para verificação');
                return false;
            }

            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Erro na verificação de senha:', error);
            return false;
        }
    },

    /**
     * Verifica força da senha (validação client-side)
     * @param password - Senha a validar
     * @returns Objeto com resultado da validação
     */
    validatePasswordStrength: (password: string): {
        valid: boolean;
        errors: string[];
    } => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Senha deve ter pelo menos 8 caracteres');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra maiúscula');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra minúscula');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Senha deve conter pelo menos um caractere especial');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },
};
